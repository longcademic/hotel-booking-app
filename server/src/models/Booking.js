const mongoose = require('mongoose');
const { Schema } = mongoose;

const bookingSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    hotel: { type: Schema.Types.ObjectId, ref: 'Hotel', required: true, index: true },
    roomType: { type: Schema.Types.ObjectId, ref: 'RoomType', required: true },
    room: { type: Schema.Types.ObjectId, ref: 'Room', required: true }, // auto-assigned
    guests: { type: Number, default: 1 },
    checkIn: { type: Date, required: true },   // UTC midnight
    checkOut: { type: Date, required: true },  // UTC midnight, the guest leaves this day
    nights: { type: Number, required: true },
    pricePerNight: { type: Number, required: true }, // snapshot, so later price edits don't change old bookings
    totalPrice: { type: Number, required: true },
    specialRequests: { type: String, default: '' },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'completed', 'cancelled', 'refunded'],
      default: 'pending',
    },
    expiresAt: Date,        // pending bookings: createdAt + 30 min
    paidAt: Date,
    cancelledAt: Date,
    refundAmount: { type: Number, default: 0 },
    refundPolicy: {                       // snapshot of the hotel's policy at booking time
      allowRefund: { type: Boolean, default: true },
      refundPercent: { type: Number, default: 50 },
    },
    cancelReason: { type: String, enum: ['customer', 'expired', 'admin'] },  },
  { timestamps: true }
);
bookingSchema.index({ room: 1, checkIn: 1, checkOut: 1 });
bookingSchema.index({ status: 1, expiresAt: 1 });

module.exports = mongoose.model('Booking', bookingSchema);