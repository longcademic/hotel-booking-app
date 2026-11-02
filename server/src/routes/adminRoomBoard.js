const router = require('express').Router();
const mongoose = require('mongoose');
const Room = require('../models/Room');
const Booking = require('../models/Booking');
const { wrap } = require('../utils/crud');
const { todayUTC, blocking } = require('../utils/availability');
const { runMaintenance } = require('../jobs/bookingJobs');

// ?hotel=<id>&date=YYYY-MM-DD (default today)
router.get('/', wrap(async (req, res) => {
  if (!mongoose.isValidObjectId(req.query.hotel)) return res.status(400).json({ message: 'hotel is required' });
  await runMaintenance();
  const date = req.query.date ? new Date(`${req.query.date}T00:00:00.000Z`) : todayUTC();
  if (isNaN(date)) return res.status(400).json({ message: 'date must be YYYY-MM-DD' });

  const [rooms, bookings] = await Promise.all([
    Room.find({ hotel: req.query.hotel }).populate('roomType', 'name')
      .sort('roomNumber').collation({ locale: 'en', numericOrdering: true }).lean(),
    Booking.find({ hotel: req.query.hotel, ...blocking(), checkOut: { $gt: date } })
      .sort('checkIn').populate('user', 'name').lean(),
  ]);

  const byRoom = new Map();
  bookings.forEach((b) => byRoom.set(String(b.room), [...(byRoom.get(String(b.room)) || []), b]));
  const slim = (b) => b && { _id: b._id, guest: b.user?.name, status: b.status, checkIn: b.checkIn, checkOut: b.checkOut };

  res.json({
    date: date.toISOString().slice(0, 10),
    rooms: rooms.map((r) => {
      const list = byRoom.get(String(r._id)) || [];
      const current = list.find((b) => b.checkIn <= date);   // started, not yet checked out on `date`
      const next = list.find((b) => b.checkIn > date);
      const state = r.status === 'maintenance' ? 'maintenance'
        : current ? (current.status === 'pending' ? 'pending' : 'occupied') : 'available';
      return { _id: r._id, roomNumber: r.roomNumber, roomType: r.roomType?.name, status: r.status,
        state, current: slim(current), next: slim(next) };
    }),
  });
}));

module.exports = router;