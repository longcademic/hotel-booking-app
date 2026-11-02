const router = require('express').Router();
const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const User = require('../models/User');
const Room = require('../models/Room');
const { wrap } = require('../utils/crud');
const { cancellationInfo } = require('../utils/pricing');
const { freeRooms, blocking, overlap } = require('../utils/availability');
const { runMaintenance } = require('../jobs/bookingJobs');

const escapeRx = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// ?hotel=&status=&q=&page=&limit=   q matches guest name/email, room number, or the end of the booking id
router.get('/', wrap(async (req, res) => {
  await runMaintenance();
  const { hotel, status, q } = req.query;
  const page = Math.max(1, +req.query.page || 1);
  const limit = Math.min(50, +req.query.limit || 20);

  const filter = {};
  if (mongoose.isValidObjectId(hotel)) filter.hotel = hotel;
  if (status && status !== 'all') filter.status = status;

  const term = (q || '').trim();
  if (term) {
    const rx = new RegExp(escapeRx(term), 'i');
    const roomFilter = { roomNumber: rx, ...(filter.hotel ? { hotel: filter.hotel } : {}) };
    const [users, rooms] = await Promise.all([
      User.find({ $or: [{ name: rx }, { email: rx }] }).select('_id').limit(200).lean(),
      Room.find(roomFilter).select('_id').limit(500).lean(),
    ]);
    const or = [{ user: { $in: users.map((u) => u._id) } }, { room: { $in: rooms.map((r) => r._id) } }];
    if (/^[0-9a-f]{3,24}$/i.test(term))
      or.push({ $expr: { $regexMatch: { input: { $toString: '$_id' }, regex: `${term}$`, options: 'i' } } });
    filter.$or = or;
  }

  const [items, total] = await Promise.all([
    Booking.find(filter).sort('-createdAt').skip((page - 1) * limit).limit(limit)
      .populate('user', 'name email').populate('room', 'roomNumber')
      .populate('roomType', 'name').populate('hotel', 'name').lean(),
    Booking.countDocuments(filter),
  ]);
  items.forEach((b) => { b.cancelInfo = cancellationInfo(b, { forcePercent: 100 }); });
  res.json({ items, total, page, pages: Math.ceil(total / limit) });
}));

// Hotel-initiated cancellation: refunds 100% of the unused nights, whatever the hotel's customer policy
router.post('/:id/cancel', wrap(async (req, res) => {
  await runMaintenance();
  const b = await Booking.findById(req.params.id);
  if (!b) return res.status(404).json({ message: 'Booking not found' });
  const info = cancellationInfo(b, { forcePercent: 100 });
  if (!info.canCancel) return res.status(409).json({ message: info.reason });

  const status = b.status === 'confirmed' && info.refundAmount > 0 ? 'refunded' : 'cancelled';
  const updated = await Booking.findOneAndUpdate(
    { _id: b._id, status: b.status },
    { $set: { status, cancelledAt: new Date(), cancelReason: 'admin', refundAmount: info.refundAmount } },
    { returnDocument: 'after' }
  );
  if (!updated) return res.status(409).json({ message: 'Booking changed, please retry' });
  res.json(updated);
}));

// Move a booking to another free room of the same type (e.g. the room went into maintenance)
router.post('/:id/reassign', wrap(async (req, res) => {
  await runMaintenance();
  const b = await Booking.findById(req.params.id);
  if (!b) return res.status(404).json({ message: 'Booking not found' });
  if (!['pending', 'confirmed'].includes(b.status))
    return res.status(409).json({ message: `Booking is ${b.status}` });

  const candidates = (await freeRooms(b.roomType, b.checkIn, b.checkOut)).filter((r) => String(r._id) !== String(b.room));
  const target = req.body.roomId ? candidates.find((r) => String(r._id) === req.body.roomId) : candidates[0];
  if (!target) return res.status(409).json({ message: 'No other free room of this type for these dates' });

  const old = b.room;
  const moved = await Booking.findOneAndUpdate({ _id: b._id, room: old }, { $set: { room: target._id } }, { returnDocument: 'after' });
  if (!moved) return res.status(409).json({ message: 'Booking changed, please retry' });

  // verify nobody else grabbed that room meanwhile; if so, put it back
  const clash = await Booking.exists({ room: target._id, _id: { $ne: b._id }, ...blocking(), ...overlap(b.checkIn, b.checkOut) });
  if (clash) {
    await Booking.updateOne({ _id: b._id }, { $set: { room: old } });
    return res.status(409).json({ message: 'That room was just taken, try again' });
  }
  await moved.populate('room', 'roomNumber');
  res.json(moved);
}));

module.exports = router;