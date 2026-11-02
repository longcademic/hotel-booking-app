const mongoose = require('mongoose');
const Review = require('../models/Review');
const Hotel = require('../models/Hotel');

// Recompute from the reviews themselves, so it self-heals after deletes or edits in the DB
exports.recalcHotelRating = async (hotelId) => {
  const [row] = await Review.aggregate([
    { $match: { hotel: new mongoose.Types.ObjectId(String(hotelId)) } },
    { $group: { _id: '$hotel', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  await Hotel.findByIdAndUpdate(hotelId, {
    ratingAvg: row ? Math.round(row.avg * 100) / 100 : 0,
    reviewCount: row ? row.count : 0,
  });
};