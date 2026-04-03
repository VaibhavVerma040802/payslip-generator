const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to verify JWT
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) throw new Error();

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    const user = await User.findById(decoded.id);

    if (!user) throw new Error();

    req.user = user;
    req.token = token;
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: 'Please authenticate' });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/auth/register — Register a new company
// ─────────────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { email, password, companyName } = req.body;
    
    // Check if user exists
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ success: false, message: 'Email already registered' });

    const user = new User({ email, password, companyName });
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '7d' });
    
    res.status(201).json({ success: true, token, user: { email: user.email, companyName: user.companyName } });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ success: false, message: 'Registration failed' });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/auth/login — Login to company account
// ─────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '7d' });
    res.json({ success: true, token, user: { email: user.email, companyName: user.companyName } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Login failed' });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/auth/profile — Get company profile
// ─────────────────────────────────────────────────────────────
router.get('/profile', auth, async (req, res) => {
  res.json({ success: true, user: req.user });
});

// ─────────────────────────────────────────────────────────────
// PUT /api/auth/profile — Update company profile & logo
// ─────────────────────────────────────────────────────────────
router.put('/profile', auth, async (req, res) => {
  try {
    const updates = ['companyName', 'companyAddress', 'companyPhone', 'companyEmail', 'companyCIN', 'companyLogo'];
    updates.forEach(field => {
      if (req.body[field] !== undefined) req.user[field] = req.body[field];
    });
    
    await req.user.save();
    res.json({ success: true, message: 'Profile updated', user: req.user });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
});

module.exports = { router, auth };
