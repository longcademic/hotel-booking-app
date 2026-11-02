const router = require('express').Router();
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const { protect } = require('../middleware/auth');
const { wrap } = require('../utils/crud');
const { runMaintenance } = require('../jobs/bookingJobs');
const { recalcHotelRating } = require('../utils/reviews');

router.use(protect);

router.post('/', wrap(async (req, res) => {
  const { bookingId, rating, comment = '' } = req.body;
  await runMaintenance();                       // make sure finished stays are marked completed

  const booking = await Booking.findById(bookingId);
  if (!booking || String(booking.user) !== String(req.user._id))
    return res.status(404).json({ message: 'Booking not found' });
  if (booking.status !== 'completed')
    return res.status(409).json({ message: 'You can review a stay after check-out' });

  try {
    const review = await Review.create({
      user: req.user._id, hotel: booking.hotel, roomType: booking.roomType,
      booking: booking._id, rating: Number(rating), comment,
    });
    await recalcHotelRating(booking.hotel);
    res.status(201).json(review);
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ message: 'You already reviewed this booking' });
    throw e;
  }
}));

// The review (if any) the logged-in user wrote for one booking
router.get('/booking/:bookingId', wrap(async (req, res) => {
  const review = await Review.findOne({ booking: req.params.bookingId, user: req.user._id });
  if (!review) return res.status(404).json({ message: 'No review yet' });
  res.json(review);
}));

module.exports = router;