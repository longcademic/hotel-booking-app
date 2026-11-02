const router = require('express').Router();
const { protect, requireRole } = require('../middleware/auth');
const { crud, wrap, pick } = require('../utils/crud');
const { addRooms } = require('../utils/rooms');
const { recalcHotelRating } = require('../utils/reviews');
const Amenity = require('../models/Amenity');
const Hotel = require('../models/Hotel');
const RoomType = require('../models/RoomType');
const Room = require('../models/Room');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const multer = require('multer');
const { uploadBuffer, deleteImages } = require('../utils/images');
const { blocking, todayUTC } = require('../utils/availability');




// After a successful PATCH that changes `images`, remove the dropped ones from Cloudinary
const cleanupOnPatch = (Model) => wrap(async (req, res, next) => {
  if (!Array.isArray(req.body.images)) return next();
  const before = await Model.findById(req.params.id).select('images').lean();
  res.on('finish', () => {
    if (res.statusCode >= 300 || !before) return;
    deleteImages(before.images.filter((u) => !req.body.images.includes(u))).catch(console.error);
  });
  next();
});

const noBookings = (field) => wrap(async (req, res, next) => {
  if (await Booking.exists({ [field]: req.params.id }))
    return res.status(409).json({ message: 'Has bookings, deactivate it (isActive=false / maintenance) instead of deleting' });
  next();
});
router.use(protect, requireRole('admin'));
router.use('/stats', require('./adminStats'));
router.use('/bookings', require('./adminBookings'));
router.use('/room-board', require('./adminRoomBoard'));   
router.use('/users', require('./adminUsers')); 

const typeFields = ['hotel', 'name', 'description', 'capacity', 'beds', 'bedType',
  'sizeM2', 'pricePerNight', 'images', 'amenities', 'isActive'];

// ---- Room types: custom routes first (they win over the generic ones below) ----
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => cb(null, ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)),
});

router.post('/uploads', upload.single('image'), wrap(async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'Send a jpeg/png/webp file in field "image" (max 5 MB)' });
  const result = await uploadBuffer(req.file.buffer);
  res.status(201).json({ url: result.secure_url });
}));
// Create a type AND N rooms at once: { ...typeFields, quantity: 5, startNumber: 101 }
router.post('/room-types', wrap(async (req, res) => {
  const hotel = await Hotel.findById(req.body.hotel);
  if (!hotel) return res.status(400).json({ message: 'Hotel not found' });

  const roomType = await RoomType.create(pick(req.body, typeFields));
  const rooms = Number(req.body.quantity) > 0
    ? await addRooms(hotel._id, roomType._id, req.body.quantity, req.body.startNumber)
    : [];
  res.status(201).json({ roomType, rooms });
}));

// Add more rooms to an existing type
router.post('/room-types/:id/rooms', wrap(async (req, res) => {
  const rt = await RoomType.findById(req.params.id);
  if (!rt) return res.status(404).json({ message: 'Room type not found' });
  const rooms = await addRooms(rt.hotel, rt._id, req.body.quantity || 1, req.body.startNumber);
  res.status(201).json(rooms);
}));

// Deleting a type removes its rooms too
router.delete('/room-types/:id', noBookings('roomType'), wrap(async (req, res) => {
  const rt = await RoomType.findById(req.params.id).select('images');
  await Room.deleteMany({ roomType: req.params.id });
  await RoomType.findByIdAndDelete(req.params.id);
  if (rt) deleteImages(rt.images).catch(console.error);
  res.json({ ok: true });
}));
router.patch('/hotels/:id', cleanupOnPatch(Hotel));          // falls through to the crud PATCH below
router.patch('/room-types/:id', cleanupOnPatch(RoomType));
router.delete('/rooms/:id', noBookings('room'));
router.use('/room-types', crud(RoomType, {
  allowed: typeFields.filter((f) => f !== 'hotel'), // a type can't move between hotels
  filterKeys: ['hotel'],
  populate: 'amenities',
}));

// ---- Hotels ----
router.delete('/hotels/:id', noBookings('hotel'), wrap(async (req, res) => {
  const hotel = await Hotel.findById(req.params.id).select('images');
  const types = await RoomType.find({ hotel: req.params.id }).select('images');
  await Room.deleteMany({ hotel: req.params.id });
  await RoomType.deleteMany({ hotel: req.params.id });
  await Hotel.findByIdAndDelete(req.params.id);
  deleteImages([...(hotel?.images ?? []), ...types.flatMap((t) => t.images)]).catch(console.error);
  res.json({ ok: true });
}));

// Setting maintenance on a room that has current/upcoming bookings needs an explicit { force: true }
router.patch('/rooms/:id', wrap(async (req, res, next) => {
  if (req.body.status === 'maintenance' && !req.body.force) {
    const n = await Booking.countDocuments({ room: req.params.id, ...blocking(), checkOut: { $gt: todayUTC() } });
    if (n) return res.status(409).json({ message: `${n} upcoming booking(s) use this room`, needsForce: true });
  }
  next();                                    // falls through to the generic PATCH below
}));

// Deleting an amenity also removes it from hotels and room types
router.delete('/amenities/:id', wrap(async (req, res) => {
  await Promise.all([
    Hotel.updateMany({ amenities: req.params.id }, { $pull: { amenities: req.params.id } }),
    RoomType.updateMany({ amenities: req.params.id }, { $pull: { amenities: req.params.id } }),
  ]);
  await Amenity.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
}));

router.use('/hotels', crud(Hotel, {
  allowed: ['name', 'description', 'address', 'city', 'phone', 'openingHours',
    'checkInTime', 'checkOutTime', 'images', 'amenities', 'isActive', 'allowRefund', 'refundPercent'],
  populate: 'amenities',
}));

// ---- Amenities (tags) ----
router.use('/amenities', crud(Amenity, {
  allowed: ['name', 'icon', 'scope'],
  filterKeys: ['scope'],
}));

// ---- Individual rooms: rename number, set maintenance, remove ----
router.use('/rooms', crud(Room, {
  allowed: ['roomNumber', 'status'],
  filterKeys: ['hotel', 'roomType', 'status'],
  populate: { path: 'roomType', select: 'name' },
}));


router.get('/reviews', wrap(async (req, res) => {
  const filter = req.query.hotel ? { hotel: req.query.hotel } : {};
  res.json(await Review.find(filter).sort('-createdAt').limit(200)
    .populate('user', 'name email').populate('hotel', 'name').populate('roomType', 'name'));
}));

router.delete('/reviews/:id', wrap(async (req, res) => {
  const review = await Review.findByIdAndDelete(req.params.id);
  if (!review) return res.status(404).json({ message: 'Not found' });
  await recalcHotelRating(review.hotel);
  res.json({ ok: true });
}));
module.exports = router;