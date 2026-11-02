const router = require('express').Router();
const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Hotel = require('../models/Hotel');
const RoomType = require('../models/RoomType');
const { wrap } = require('../utils/crud');
const { DAY, todayUTC, tzOffsetMs } = require('../utils/availability');

const tzString = () => {
  const h = Number(process.env.TZ_OFFSET_HOURS || 0);
  return `${h < 0 ? '-' : '+'}${String(Math.abs(h)).padStart(2, '0')}:00`;
};

// ?hotel=<id>&days=7|30|90
router.get('/', wrap(async (req, res) => {
  const days = [7, 30, 90].includes(+req.query.days) ? +req.query.days : 30;
  const hotelId = mongoose.isValidObjectId(req.query.hotel) ? new mongoose.Types.ObjectId(req.query.hotel) : null;

  const lastDay = todayUTC();                                           // local calendar day
  const firstDay = new Date(lastDay.getTime() - (days - 1) * DAY);
  const start = new Date(firstDay.getTime() - tzOffsetMs());            // real instants of local midnight
  const end = new Date(lastDay.getTime() + DAY - tzOffsetMs());

  const hotelMatch = hotelId ? { hotel: hotelId } : {};
  const created = { ...hotelMatch, createdAt: { $gte: start, $lt: end } };
  const dayKey = (field) => ({ $dateToString: { format: '%Y-%m-%d', date: field, timezone: tzString() } });

  const mostBookedBy = hotelId ? 'roomType' : 'hotel';
  const lookupFrom = hotelId ? RoomType.collection.name : Hotel.collection.name;

  const [byStatusRows, paidRows, completedRows, confirmedRows, cancelledRows, mostRows] = await Promise.all([
    Booking.aggregate([{ $match: created }, { $group: { _id: '$status', n: { $sum: 1 } } }]),
    Booking.aggregate([
      { $match: { ...created, paidAt: { $exists: true } } },
      { $group: { _id: null, reservations: { $sum: 1 },
          revenue: { $sum: { $subtract: ['$totalPrice', { $ifNull: ['$refundAmount', 0] }] } } } },
    ]),
    Booking.aggregate([
      { $match: { ...created, status: 'completed' } },
      { $group: { _id: null, avg: { $avg: '$nights' } } },
    ]),
    Booking.aggregate([
      { $match: { ...hotelMatch, paidAt: { $gte: start, $lt: end } } },
      { $group: { _id: dayKey('$paidAt'), n: { $sum: 1 } } },
    ]),
    Booking.aggregate([
      { $match: { ...hotelMatch, cancelReason: 'customer', cancelledAt: { $gte: start, $lt: end } } },
      { $group: { _id: dayKey('$cancelledAt'), n: { $sum: 1 } } },
    ]),
    Booking.aggregate([
      { $match: { ...created, paidAt: { $exists: true } } },
      { $group: { _id: `$${mostBookedBy}`, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 6 },
      { $lookup: { from: lookupFrom, localField: '_id', foreignField: '_id', as: 'doc' } },
      { $project: { count: 1, name: { $arrayElemAt: ['$doc.name', 0] } } },
    ]),
  ]);

  const byStatus = Object.fromEntries(byStatusRows.map((r) => [r._id, r.n]));
  const conf = new Map(confirmedRows.map((r) => [r._id, r.n]));
  const canc = new Map(cancelledRows.map((r) => [r._id, r.n]));
  const trend = Array.from({ length: days }, (_, i) => {
    const date = new Date(firstDay.getTime() + i * DAY).toISOString().slice(0, 10);
    return { date, confirmed: conf.get(date) || 0, cancelled: canc.get(date) || 0 };
  });

  const paid = paidRows[0];
  res.json({
    days,
    kpi: {
      reservations: paid?.reservations || 0,
      revenue: Math.round((paid?.revenue || 0) * 100) / 100,
      completed: byStatus.completed || 0,
      avgNights: completedRows[0] ? Math.round(completedRows[0].avg * 10) / 10 : null,
      pending: byStatus.pending || 0,
      byStatus,
    },
    trend,
    mostBooked: { by: mostBookedBy, items: mostRows.map((r) => ({ _id: r._id, name: r.name || 'Deleted', count: r.count })) },
  });
}));

module.exports = router;