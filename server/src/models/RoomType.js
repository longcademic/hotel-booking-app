const mongoose = require('mongoose');

const roomTypeSchema = new mongoose.Schema(
  {
    hotel: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    capacity: { type: Number, required: true, min: 1 }, // max guests
    beds: { type: Number, default: 1, min: 1 },
    bedType: { type: String, default: 'Double' },
    sizeM2: Number,
    pricePerNight: { type: Number, required: true, min: 0 },
    images: [String],
    amenities: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Amenity' }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('RoomType', roomTypeSchema);