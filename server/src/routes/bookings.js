const router = require('express').Router();
const Booking = require('../models/Booking');
const RoomType = require('../models/RoomType');
const { protect } = require('../middleware/auth');
const { wrap } = require('../utils/crud');
const { parseRange, availableCounts, freeRooms, blocking, overlap } = require('../utils/availability');
const { quote, cancellationInfo } = require('../utils/pricing');
const { runMaintenance } = require('../jobs/bookingJobs');

const MAX_PENDING_PER_USER = 3;

async function loadRoomType(id, guests) {
  const rt = await RoomType.findOne({ _id: id, isActive: true }).populate('hotel');
  if (!rt || !rt.hotel || !rt.hotel.isActive) throw Object.assign(new Error('Room type not found'), { status: 404 });
  if (guests > rt.capacity) throw Object.assign(new Error(`Max ${rt.capacity} guests for this room`), { status: 400 });
  return rt;
}
const policyOf = (hotel) => ({
  allowRefund: hotel.allowRefund !== false,
  refundPercent: hotel.refundPercent ?? 50,
});

// ---- Public: price quote (guests can see it before logging in) ----
router.post('/quote', wrap(async (req, res) => {
  const { roomTypeId, checkIn, checkOut, guests = 1 } = req.body;
  const range = parseRange(checkIn, checkOut);
  const rt = await loadRoomType(roomTypeId, guests);
  const counts = await availableCounts([rt._id], range.checkIn, range.checkOut);
  res.json({
    roomType: { _id: rt._id, name: rt.name, capacity: rt.capacity },
    hotel: { _id: rt.hotel._id, name: rt.hotel.name, city: rt.hotel.city },
    checkIn, checkOut, guests,
    ...quote(rt, range),
    availableRooms: counts.get(String(rt._id)) || 0,
    refundPolicy: policyOf(rt.hotel),
  });
}));

router.use(protect);

// ---- Create a pending booking: auto-assign a room, hold it for 30 minutes ----
router.post('/', wrap(async (req, res) => {
  const { roomTypeId, guests = 1, specialRequests = '' } = req.body;
  const range = parseRange(req.body.checkIn, req.body.checkOut);
  const rt = await loadRoomType(roomTypeId, guests);

  const holds = await Booking.countDocuments({ user: req.user._id, status: 'pending', expiresAt: { $gt: new Date() } });
  if (holds >= MAX_PENDING_PER_USER)
    return res.status(429).json({ message: 'Too many unpaid bookings. Pay or cancel one first.' });

  const { pricePerNight, total } = quote(rt, range);

  for (let attempt = 0; attempt < 3; attempt++) {
    const candidates = await freeRooms(rt._id, range.checkIn, range.checkOut);
    if (!candidates.length) break;

    for (const room of candidates) {
      const booking = new Booking({
        user: req.user._id, hotel: rt.hotel._id, roomType: rt._id, room: room._id, guests,
        checkIn: range.checkIn, checkOut: range.checkOut, nights: range.nights,
        pricePerNight, totalPrice: total, specialRequests: String(specialRequests).slice(0, 500),
        status: 'pending', expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        refundPolicy: policyOf(rt.hotel),
      });
      await booking.save();

      // Insert-then-verify: if an older (smaller _id) active booking overlaps on this room, back off.
      // Two simultaneous requests can never both keep the same room, since _id gives a total order.
      const clash = await Booking.exists({
        room: room._id, _id: { $lt: booking._id }, ...blocking(), ...overlap(range.checkIn, range.checkOut),
      });
      if (!clash) return res.status(201).json(booking);
      await Booking.deleteOne({ _id: booking._id });
    }
  }
  res.status(409).json({ message: 'No rooms available for these dates' });
}));

// ---- Mine ----
router.get('/my', wrap(async (req, res) => {
  await runMaintenance();
  res.json(await Booking.find({ user: req.user._id }).sort('-createdAt').lean()
    .populate('hotel', 'name city images').populate('roomType', 'name images').populate('room', 'roomNumber'));
}));

async function findOwn(req) {
  const b = await Booking.findById(req.params.id);
  if (!b || String(b.user) !== String(req.user._id))
    throw Object.assign(new Error('Booking not found'), { status: 404 });
  return b;
}

router.get('/:id', wrap(async (req, res) => {
  await runMaintenance();
  const b = await findOwn(req);
  await b.populate([
    { path: 'hotel', select: 'name city address images' },
    { path: 'roomType', select: 'name images' },
    { path: 'room', select: 'roomNumber' },
  ]);
  const out = b.toObject();
  out.cancelInfo = cancellationInfo(b);
  if (b.status === 'pending') out.secondsLeft = Math.max(0, Math.floor((b.expiresAt - Date.now()) / 1000)); // server clock
  res.json(out);
}));

// ---- Mock payment ----
router.post('/:id/pay', wrap(async (req, res) => {
  await runMaintenance();
  const b = await findOwn(req);
  if (b.status !== 'pending') return res.status(409).json({ message: `Booking is ${b.status}` });
  if (req.body.simulateFailure) return res.status(402).json({ message: 'Payment declined (simulated)' });

  const paid = await Booking.findOneAndUpdate(               // atomic: can't race with expiry
    { _id: b._id, status: 'pending', expiresAt: { $gt: new Date() } },
    { $set: { status: 'confirmed', paidAt: new Date() } },
    { new: true }
  );
  if (!paid) return res.status(410).json({ message: 'Booking expired' });
  res.json(paid);
}));

// ---- Cancel (+ mock refund) ----
router.post('/:id/cancel', wrap(async (req, res) => {
  await runMaintenance();
  const b = await findOwn(req);
  const info = cancellationInfo(b);
  if (!info.canCancel) return res.status(409).json({ message: info.reason });

  const status = b.status === 'confirmed' && info.refundAmount > 0 ? 'refunded' : 'cancelled';
  const updated = await Booking.findOneAndUpdate(
    { _id: b._id, status: b.status },
    { $set: { status, cancelledAt: new Date(), cancelReason: 'customer', refundAmount: info.refundAmount } },
    { new: true }
  );
  if (!updated) return res.status(409).json({ message: 'Booking changed, please retry' });
  res.json(updated);
}));

module.exports = router;