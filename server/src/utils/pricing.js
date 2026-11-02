const { DAY, todayUTC } = require('./availability');

exports.quote = (roomType, range) => {
  const subtotal = roomType.pricePerNight * range.nights;
  return { nights: range.nights, pricePerNight: roomType.pricePerNight, total: subtotal }; // taxes/fees could be added here
};

// What happens if the customer cancels right now
exports.cancellationInfo = (b, opts = {}) => {
  const policy = b.refundPolicy || { allowRefund: true, refundPercent: 50 };
  const base = { allowRefund: policy.allowRefund, refundPercent: policy.refundPercent };

  if (b.status === 'pending')
    return { ...base, canCancel: true, refundAmount: 0, spentNights: 0, remainingNights: b.nights };
  if (b.status !== 'confirmed')
    return { ...base, canCancel: false, reason: `Booking is already ${b.status}`, refundAmount: 0 };

  const today = todayUTC();
  if (today >= b.checkOut)
    return { ...base, canCancel: false, reason: 'Stay is already over', refundAmount: 0 };

  const spentNights = Math.min(b.nights, Math.max(0, Math.round((today - b.checkIn) / DAY)));
  const remainingNights = b.nights - spentNights;
  const pct = opts.forcePercent ?? (policy.allowRefund ? policy.refundPercent : 0);
  const refundAmount = Math.round(remainingNights * b.pricePerNight * pct) / 100;
  return { ...base, canCancel: true, spentNights, remainingNights, refundAmount };
};