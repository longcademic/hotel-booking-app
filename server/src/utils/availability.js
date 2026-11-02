const Room = require('../models/Room');
const Booking = require('../models/Booking');

const DAY = 86400000;
const httpError = (status, message) => Object.assign(new Error(message), { status });
const tzOffsetMs = () => Number(process.env.TZ_OFFSET_HOURS || 0) * 3600000;

// Midnight (as a UTC Date) of the current calendar day in the hotel's timezone
const todayUTC = () => {
  const local = new Date(Date.now() + Number(process.env.TZ_OFFSET_HOURS || 0) * 3600000);
  return new Date(local.toISOString().slice(0, 10) + 'T00:00:00.000Z');
};

const parseRange = (checkIn, checkOut) => {
  const a = new Date(`${checkIn}T00:00:00.000Z`);
  const b = new Date(`${checkOut}T00:00:00.000Z`);
  if (isNaN(a) || isNaN(b)) throw httpError(400, 'Dates must be YYYY-MM-DD');
  if (b <= a) throw httpError(400, 'checkOut must be after checkIn');
  if (a < todayUTC()) throw httpError(400, 'checkIn cannot be in the past');
  return { checkIn: a, checkOut: b, nights: Math.round((b - a) / DAY) };
};

// Blocks its room: confirmed, or pending and not yet expired
const blocking = () => ({
  $or: [{ status: 'confirmed' }, { status: 'pending', expiresAt: { $gt: new Date() } }],
});

const overlap = (checkIn, checkOut) => ({ checkIn: { $lt: checkOut }, checkOut: { $gt: checkIn } });

// Map(typeId -> number of free rooms) for [checkIn, checkOut)
const availableCounts = async (typeIds, checkIn, checkOut) => {
  const booked = await Booking.distinct('room', {
    roomType: { $in: typeIds }, ...blocking(), ...overlap(checkIn, checkOut),
  });
  const rows = await Room.aggregate([
    { $match: { roomType: { $in: typeIds }, status: 'available', _id: { $nin: booked } } },
    { $group: { _id: '$roomType', count: { $sum: 1 } } },
  ]);
  return new Map(rows.map((r) => [String(r._id), r.count]));
};

// Free rooms of one type, lowest room number first
const freeRooms = async (roomTypeId, checkIn, checkOut) => {
  const booked = await Booking.distinct('room', {
    roomType: roomTypeId, ...blocking(), ...overlap(checkIn, checkOut),
  });
  return Room.find({ roomType: roomTypeId, status: 'available', _id: { $nin: booked } })
    .sort('roomNumber').collation({ locale: 'en', numericOrdering: true });
};

module.exports = { DAY, httpError, todayUTC,tzOffsetMs, parseRange, blocking, overlap, availableCounts, freeRooms };