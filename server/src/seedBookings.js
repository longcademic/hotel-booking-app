require('dotenv').config();
const connectDB = require('./config/db');
const User = require('./models/User');
const Booking = require('./models/Booking');
const RoomType = require('./models/RoomType');
const Room = require('./models/Room');
const Hotel = require('./models/Hotel');
const { DAY, todayUTC } = require('./utils/availability');

const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = (arr) => arr[rnd(0, arr.length - 1)];

(async () => {
  await connectDB();
  let users = await User.find({ email: /@demo\.test$/ });
  await Booking.deleteMany({ user: { $in: users.map((u) => u._id) } });
  if (process.argv.includes('--clear')) {
    await User.deleteMany({ _id: { $in: users.map((u) => u._id) } });
    console.log('Demo data removed');
    process.exit(0);
  }
  if (!users.length)
    users = await Promise.all([1, 2, 3, 4, 5, 6].map((i) =>
      User.create({ name: `Demo Guest ${i}`, email: `guest${i}@demo.test`, password: '123456' })));

  const types = await RoomType.find({ isActive: true }).populate('hotel');
  const roomsByType = new Map();
  (await Room.find({ status: 'available' })).forEach((r) => {
    const k = String(r.roomType);
    roomsByType.set(k, [...(roomsByType.get(k) || []), r]);
  });

  const now = Date.now();
  const today = todayUTC();
  const taken = new Map(); // roomId -> [[checkIn, checkOut], ...] for bookings that block
  const isFree = (room, a, b) => !(taken.get(String(room._id)) || []).some(([x, y]) => x < b && y > a);
  const docs = [];

  for (let i = 0; i < 130; i++) {
    const type = pick(types);
    const createdAt = new Date(now - rnd(0, 29 * 1440) * 60000);
    const day0 = new Date(createdAt.toISOString().slice(0, 10) + 'T00:00:00.000Z');
    const nights = rnd(1, 5);
    const checkIn = new Date(day0.getTime() + rnd(1, 20) * DAY);
    const checkOut = new Date(checkIn.getTime() + nights * DAY);
    const room = (roomsByType.get(String(type._id)) || []).find((r) => isFree(r, checkIn, checkOut));
    if (!room) continue;

    const totalPrice = type.pricePerNight * nights;
    const doc = {
      user: pick(users)._id, hotel: type.hotel._id, roomType: type._id, room: room._id,
      guests: rnd(1, type.capacity), checkIn, checkOut, nights,
      pricePerNight: type.pricePerNight, totalPrice, refundAmount: 0,
      specialRequests: pick(['', '', 'Extra pillow', 'Late check-in', 'Quiet room', 'Baby cot']),
      refundPolicy: { allowRefund: type.hotel.allowRefund !== false, refundPercent: type.hotel.refundPercent ?? 50 },
      createdAt, updatedAt: createdAt,
    };

    const roll = Math.random();
    if (roll < 0.12) {                                           // never paid, hold expired
      Object.assign(doc, { status: 'cancelled', cancelReason: 'expired',
        expiresAt: new Date(+createdAt + 30 * 60000), cancelledAt: new Date(+createdAt + 30 * 60000) });
    } else {
      const paidAt = new Date(+createdAt + rnd(1, 20) * 60000);
      doc.paidAt = paidAt;
      if (roll < 0.27) {                                         // paid, then cancelled by customer
        Object.assign(doc, { status: 'refunded', cancelReason: 'customer', refundAmount: totalPrice * 0.5,
          cancelledAt: new Date(Math.min(now, +paidAt + rnd(1, 3000) * 60000)) });
      } else {
        doc.status = checkOut <= today ? 'completed' : 'confirmed';
        taken.set(String(room._id), [...(taken.get(String(room._id)) || []), [checkIn, checkOut]]);
      }
    }
    docs.push(doc);
  }

  await Booking.collection.insertMany(docs);   // raw insert so createdAt/paidAt keep their past values
  console.log(`Inserted ${docs.length} demo bookings`);
  process.exit(0);
})();