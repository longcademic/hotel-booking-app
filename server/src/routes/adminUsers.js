const router = require('express').Router();
const User = require('../models/User');
const { wrap } = require('../utils/crud');

const escapeRx = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

router.get('/', wrap(async (req, res) => {
  const q = (req.query.q || '').trim();
  const rx = q && new RegExp(escapeRx(q), 'i');
  const filter = q ? { $or: [{ name: rx }, { email: rx }] } : {};
  const page = Math.max(1, +req.query.page || 1);
  const limit = Math.min(50, +req.query.limit || 20);
  const [items, total] = await Promise.all([
    User.find(filter).sort('-createdAt').skip((page - 1) * limit).limit(limit).lean(),   // password is select:false
    User.countDocuments(filter),
  ]);
  res.json({ items, total, page, pages: Math.ceil(total / limit) });
}));

router.patch('/:id', wrap(async (req, res) => {
  if (String(req.params.id) === String(req.user._id))
    return res.status(400).json({ message: "You can't change your own account" });
  const update = {};
  if (typeof req.body.isActive === 'boolean') update.isActive = req.body.isActive;
  if (['customer', 'admin'].includes(req.body.role)) update.role = req.body.role;
  const user = await User.findByIdAndUpdate(req.params.id, update, { returnDocument: 'after' }).lean();
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
}));

module.exports = router;