const Booking = require('../models/Booking');
const { todayUTC } = require('../utils/availability');

// Idempotent. Also called lazily from booking routes, so correctness never depends on the timer.
async function runMaintenance() {
  const now = new Date();
  await Booking.updateMany(
    { status: 'pending', expiresAt: { $lte: now } },
    { $set: { status: 'cancelled', cancelledAt: now, cancelReason: 'expired' } }
  );
  await Booking.updateMany(
    { status: 'confirmed', checkOut: { $lte: todayUTC() } },
    { $set: { status: 'completed' } }
  );
}

function startBookingJobs() {
  const run = () => runMaintenance().catch((e) => console.error('booking job', e));
  run();
  setInterval(run, 60 * 1000);
}

module.exports = { runMaintenance, startBookingJobs };