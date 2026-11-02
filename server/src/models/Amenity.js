const mongoose = require('mongoose');

const amenitySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    icon: { type: String, default: 'checkmark-circle' }, // Ionicons name, used by the app later
    scope: { type: String, enum: ['hotel', 'room'], required: true },
  },
  { timestamps: true }
);
amenitySchema.index({ name: 1, scope: 1 }, { unique: true });

module.exports = mongoose.model('Amenity', amenitySchema);