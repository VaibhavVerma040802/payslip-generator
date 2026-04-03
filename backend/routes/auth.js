const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const crypto = require('crypto');
const { sendVerificationEmail } = require('../utils/emailService');

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

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = Date.now() + 24 * 3600000; // 24 hours

    const user = new User({ email, password, companyName, verificationToken, verificationExpires });
    await user.save();

    // Send verification email (non-blocking)
    sendVerificationEmail(user, verificationToken).catch(console.error);
    
    res.status(201).json({ 
      success: true, 
      message: 'Registration successful! Please check your email to verify your account.' 
    });
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

    if (!user.isVerified) {
      return res.status(403).json({ success: false, message: 'Please verify your email address before logging in.' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '7d' });
    res.json({ success: true, token, user: { email: user.email, companyName: user.companyName } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Login failed' });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/auth/verify-email — Verify account
// ─────────────────────────────────────────────────────────────
router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ success: false, message: 'Token is required' });

    const user = await User.findOne({
      verificationToken: token,
      verificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).send(`
        <div style="font-family: sans-serif; text-align: center; padding: 50px;">
          <h1 style="color: #ef4444;">Verification Failed</h1>
          <p>The link is invalid or has expired.</p>
          <a href="/login" style="color: #1e3a5f; font-weight: bold;">Back to Login</a>
        </div>
      `);
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationExpires = undefined;
    await user.save();

    res.send(`
      <div style="font-family: sans-serif; text-align: center; padding: 50px;">
        <h1 style="color: #10b981;">Email Verified Successfully!</h1>
        <p>You can now log in to your account.</p>
        <a href="/login" style="display: inline-block; background: #1e3a5f; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 20px;">Go to Login</a>
      </div>
    `);
  } catch (err) {
    console.error('Verify error:', err);
    res.status(500).send('Internal Server Error');
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
