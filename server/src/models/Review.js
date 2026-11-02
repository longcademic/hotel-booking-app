const mongoose = require('mongoose');
const { Schema } = mongoose;

const reviewSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    hotel: { type: Schema.Types.ObjectId, ref: 'Hotel', required: true, index: true },
    roomType: { type: Schema.Types.ObjectId, ref: 'RoomType' },           // what they stayed in, for display
    booking: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true }, // one per booking
    rating: { type: Number, required: true, min: 1, max: 5, validate: Number.isInteger },
    comment: { type: String, trim: true, maxlength: 1000, default: '' },
  },
  { timestamps: true }
);
reviewSchema.index({ hotel: 1, createdAt: -1 });

module.exports = mongoose.model('Review', reviewSchema);