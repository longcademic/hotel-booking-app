const Room = require('../models/Room');

exports.addRooms = async (hotelId, roomTypeId, quantity, startNumber) => {
  const existing = await Room.find({ hotel: hotelId }).select('roomNumber');
  const used = new Set(existing.map((r) => r.roomNumber));

  let n = Number(startNumber);
  if (!n) {
    // default: continue after the highest numeric room number, or 101
    const max = Math.max(0, ...existing.map((r) => parseInt(r.roomNumber, 10) || 0));
    n = max ? max + 1 : 101;
  }

  const docs = [];
  while (docs.length < Number(quantity)) {
    const num = String(n++);
    if (!used.has(num)) docs.push({ hotel: hotelId, roomType: roomTypeId, roomNumber: num });
  }
  return Room.insertMany(docs);
};