const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema(
  {
    hotel: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', required: true, index: true },
    roomType: { type: mongoose.Schema.Types.ObjectId, ref: 'RoomType', required: true, index: true },
    roomNumber: { type: String, required: true, trim: true },
    status: { type: String, enum: ['available', 'maintenance'], default: 'available' },
  },
  { timestamps: true }
);
roomSchema.index({ hotel: 1, roomNumber: 1 }, { unique: true });

module.exports = mongoose.model('Room', roomSchema);