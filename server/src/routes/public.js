const router = require('express').Router();
const mongoose = require('mongoose');
const Hotel = require('../models/Hotel');
const RoomType = require('../models/RoomType');
const Amenity = require('../models/Amenity');
const Review = require('../models/Review');
const { wrap } = require('../utils/crud');
const { parseRange, availableCounts } = require('../utils/availability');

const escapeRx = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const toIds = (csv) =>
  String(csv).split(',').filter(mongoose.isValidObjectId).map((id) => new mongoose.Types.ObjectId(id));
const rangeOf = (q) => (q.checkIn && q.checkOut ? parseRange(q.checkIn, q.checkOut) : null);

const HOTEL_SORTS = {
  rating: { ratingAvg: -1, reviewCount: -1, _id: 1 },
  reviews: { reviewCount: -1, _id: 1 },
  price_asc: { minPrice: 1, _id: 1 },
  price_desc: { minPrice: -1, _id: 1 },
};
const TYPE_SORTS = { price_asc: { pricePerNight: 1 }, price_desc: { pricePerNight: -1 }, capacity: { capacity: -1 } };

// Adds availableRooms / nights / totalPrice to room types when dates are given
async function withAvailability(types, range) {
  if (!range) return types.map((t) => ({ ...t, availableRooms: null }));
  const counts = await availableCounts(types.map((t) => t._id), range.checkIn, range.checkOut);
  return types.map((t) => ({
    ...t,
    availableRooms: counts.get(String(t._id)) || 0,
    nights: range.nights,
    totalPrice: t.pricePerNight * range.nights,
  }));
}

router.get('/amenities', wrap(async (req, res) => {
  const filter = req.query.scope ? { scope: req.query.scope } : {};
  res.json(await Amenity.find(filter).sort('name'));
}));

router.get('/cities', wrap(async (_req, res) => {
  const values = await Hotel.distinct('city', { isActive: true });
  const cities = new Map();
  values.forEach((value) => {
    const city = String(value || '').trim();
    const key = city.toLowerCase();
    if (city && !cities.has(key)) cities.set(key, city);
  });
  res.json([...cities.values()].sort((a, b) => a.localeCompare(b)));
}));

// Hotel list: ?q=&city=&minPrice=&maxPrice=&guests=&amenities=id,id&sort=&checkIn=&checkOut=&page=&limit=
router.get('/hotels', wrap(async (req, res) => {
  const { q, city, minPrice, maxPrice, guests, amenities, sort = 'rating' } = req.query;
  const page = Math.max(1, +req.query.page || 1);
  const limit = Math.min(50, +req.query.limit || 10);
  const range = rangeOf(req.query);

  const match = { isActive: true };
  if (q) {
    const rx = new RegExp(escapeRx(q), 'i');
    match.name = rx;
  }
  if (city) match.city = new RegExp(`^${escapeRx(city)}$`, 'i');
  if (amenities) match.amenities = { $all: toIds(amenities) };

  // a hotel qualifies if at least one of its room types fits price + guest count
  const cond = [true];
  if (minPrice) cond.push({ $gte: ['$$t.pricePerNight', +minPrice] });
  if (maxPrice) cond.push({ $lte: ['$$t.pricePerNight', +maxPrice] });
  if (guests) cond.push({ $gte: ['$$t.capacity', +guests] });

  let rows = await Hotel.aggregate([
    { $match: match },
    { $lookup: {
        from: RoomType.collection.name, let: { hid: '$_id' }, as: 'types',
        pipeline: [{ $match: { isActive: true, $expr: { $eq: ['$hotel', '$$hid'] } } }],
    } },
    { $addFields: { types: { $filter: { input: '$types', as: 't', cond: { $and: cond } } } } },
    { $match: { 'types.0': { $exists: true } } },
    { $addFields: { minPrice: { $min: '$types.pricePerNight' } } },
    { $sort: HOTEL_SORTS[sort] || HOTEL_SORTS.rating },
  ]);

  if (range) {
    const counts = await availableCounts(rows.flatMap((h) => h.types.map((t) => t._id)), range.checkIn, range.checkOut);
    rows = rows.filter((h) => h.types.some((t) => counts.get(String(t._id)) > 0));
  }

  const total = rows.length;
  const items = rows.slice((page - 1) * limit, page * limit).map(({ types, ...h }) => h);
  await Hotel.populate(items, { path: 'amenities', select: 'name icon' });
  res.json({ items, total, page, pages: Math.ceil(total / limit) });
}));

router.get('/hotels/:id', wrap(async (req, res) => {
  const hotel = await Hotel.findOne({ _id: req.params.id, isActive: true }).populate('amenities', 'name icon');
  if (!hotel) return res.status(404).json({ message: 'Hotel not found' });
  res.json(hotel);
}));

// Room types of a hotel: ?minPrice=&maxPrice=&guests=&amenities=&sort=&checkIn=&checkOut=&onlyAvailable=1
router.get('/hotels/:id/room-types', wrap(async (req, res) => {
  const { minPrice, maxPrice, guests, amenities, sort = 'price_asc', onlyAvailable } = req.query;
  const range = rangeOf(req.query);

  const filter = { hotel: req.params.id, isActive: true };
  if (minPrice || maxPrice) {
    filter.pricePerNight = {};
    if (minPrice) filter.pricePerNight.$gte = +minPrice;
    if (maxPrice) filter.pricePerNight.$lte = +maxPrice;
  }
  if (guests) filter.capacity = { $gte: +guests };
  if (amenities) filter.amenities = { $all: toIds(amenities) };

  const types = await RoomType.find(filter).populate('amenities', 'name icon')
    .sort(TYPE_SORTS[sort] || TYPE_SORTS.price_asc).lean();
  let result = await withAvailability(types, range);
  if (onlyAvailable && range) result = result.filter((t) => t.availableRooms > 0);
  res.json(result);
}));

router.get('/room-types/:id', wrap(async (req, res) => {
  const type = await RoomType.findOne({ _id: req.params.id, isActive: true })
    .populate('amenities', 'name icon').populate('hotel', 'name city address').lean();
  if (!type) return res.status(404).json({ message: 'Room type not found' });
  // withAvailability only needs _id/pricePerNight, `hotel` is populated so it passes through untouched
  const [result] = await withAvailability([type], rangeOf(req.query));
  res.json(result);
}));
router.get('/hotels/:id/reviews', wrap(async (req, res) => {
  const hotelId = new mongoose.Types.ObjectId(req.params.id);
  const page = Math.max(1, +req.query.page || 1);
  const limit = Math.min(50, +req.query.limit || 10);

  const [hotel, dist, items] = await Promise.all([
    Hotel.findById(hotelId).select('ratingAvg reviewCount'),
    Review.aggregate([{ $match: { hotel: hotelId } }, { $group: { _id: '$rating', n: { $sum: 1 } } }]),
    Review.find({ hotel: hotelId }).sort('-createdAt').skip((page - 1) * limit).limit(limit)
      .populate('user', 'name').populate('roomType', 'name').lean(),
  ]);
  if (!hotel) return res.status(404).json({ message: 'Hotel not found' });

  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  dist.forEach((d) => { distribution[d._id] = d.n; });
  res.json({
    summary: { ratingAvg: hotel.ratingAvg, reviewCount: hotel.reviewCount, distribution },
    items, page, pages: Math.ceil(hotel.reviewCount / limit),
  });
}));
module.exports = router;
