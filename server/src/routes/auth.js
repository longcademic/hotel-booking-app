const router = require('express').Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const sign = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

const publicUser = (u) => ({ id: u._id, name: u.name, email: u.email, role: u.role });

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: 'name, email, password are required' });
    if (await User.findOne({ email: email.toLowerCase() }))
      return res.status(409).json({ message: 'Email already registered' });

    const user = await User.create({ name, email, password }); // role always 'customer' here
    res.status(201).json({ token: sign(user), user: publicUser(user) });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: (email || '').toLowerCase() }).select('+password');
    if (!user || !(await user.comparePassword(password || '')))
      return res.status(401).json({ message: 'Invalid email or password' });
    if (!user.isActive) return res.status(403).json({ message: 'Account disabled' });

    res.json({ token: sign(user), user: publicUser(user) });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.get('/me', protect, (req, res) => res.json({ user: publicUser(req.user) }));

module.exports = router;