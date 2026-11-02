const mongoose = require('mongoose');

const hotelSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    address: { type: String, required: true },
    city: { type: String, required: true, trim: true },
    phone: String,
    openingHours: { type: String, default: 'Reception open 24/7' },
    checkInTime: { type: String, default: '14:00' },
    checkOutTime: { type: String, default: '12:00' },
    images: [String],
    amenities: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Amenity' }],
    // Maintained by the review system (Phase 5), never set by clients
    ratingAvg: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    allowRefund: { type: Boolean, default: true },
    refundPercent: { type: Number, default: 50, min: 0, max: 100 },
  },
  { timestamps: true }
);
hotelSchema.index({ name: 'text', city: 'text', address: 'text' });

module.exports = mongoose.model('Hotel', hotelSchema);