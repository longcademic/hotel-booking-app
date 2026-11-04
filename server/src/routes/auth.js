const router = require('express').Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const sign = (user) =>
  jwt.sign({ id: user._id, role: user.role, tokenVersion: user.tokenVersion ?? 0 }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

const publicUser = (u) => ({ id: u._id, name: u.name, email: u.email, phone: u.phone ?? '', role: u.role });

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone = '' } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: 'name, email, password are required' });
    if (typeof phone !== 'string' || phone.trim().length > 30)
      return res.status(400).json({ message: 'phone must be 30 characters or fewer' });
    if (await User.findOne({ email: email.toLowerCase() }))
      return res.status(409).json({ message: 'Email already registered' });

    const user = await User.create({ name, email, password, phone: phone.trim() }); // role always 'customer' here
    res.status(201).json({ token: sign(user), user: publicUser(user) });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: (email || '').toLowerCase() }).select('+password +tokenVersion');
    if (!user || !(await user.comparePassword(password || '')))
      return res.status(401).json({ message: 'Invalid email or password' });
    if (!user.isActive) return res.status(403).json({ message: 'Account disabled' });

    res.json({ token: sign(user), user: publicUser(user) });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.get('/me', protect, (req, res) => res.json({ user: publicUser(req.user) }));

router.patch('/me', protect, async (req, res) => {
  try {
    const { name, phone } = req.body;
    if (typeof name !== 'string' || !name.trim())
      return res.status(400).json({ message: 'Name is required' });
    if (phone !== undefined && (typeof phone !== 'string' || phone.trim().length > 30))
      return res.status(400).json({ message: 'phone must be 30 characters or fewer' });

    req.user.name = name.trim();
    if (phone !== undefined) req.user.phone = phone.trim();
    await req.user.save();
    res.json({ user: publicUser(req.user) });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

router.post('/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (typeof currentPassword !== 'string' || !currentPassword || typeof newPassword !== 'string' || !newPassword)
      return res.status(400).json({ message: 'Current and new passwords are required' });
    if (newPassword.length < 6)
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    if (newPassword === currentPassword)
      return res.status(400).json({ message: 'New password must differ from the current password' });

    const user = await User.findById(req.user._id).select('+password +tokenVersion');
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!(await user.comparePassword(currentPassword)))
      return res.status(400).json({ message: 'Current password is incorrect' });

    user.password = newPassword;
    user.tokenVersion = (user.tokenVersion ?? 0) + 1;
    await user.save();
    res.json({ message: 'Password changed successfully', token: sign(user) });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

module.exports = router;
