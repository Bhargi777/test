const bcrypt = require('bcryptjs');
const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authenticate = require('../middleware/authenticate');

const router = express.Router();
const cookieName = 'token';
const cookieMaxAge = 7 * 24 * 60 * 60 * 1000;

function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: cookieMaxAge,
    path: '/'
  };
}

function publicUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    createdAt: user.createdAt
  };
}

function createSession(res, user) {
  const token = jwt.sign({}, process.env.JWT_SECRET, {
    subject: user._id.toString(),
    expiresIn: '7d'
  });
  res.cookie(cookieName, token, cookieOptions());
}

function validateCredentials(req, res) {
  const { email, password } = req.body || {};
  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    res.status(400).json({ error: 'A valid email address is required' });
    return null;
  }
  if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
    res.status(400).json({ error: 'Password must be between 8 and 128 characters' });
    return null;
  }
  return { email: email.trim().toLowerCase(), password };
}

router.post('/register', async (req, res, next) => {
  const credentials = validateCredentials(req, res);
  if (!credentials) return;
  const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
  if (!name || name.length > 80) {
    return res.status(400).json({ error: 'Name must be between 1 and 80 characters' });
  }

  try {
    const existing = await User.findOne({ email: credentials.email });
    if (existing) {
      return res.status(409).json({ error: 'An account with that email already exists' });
    }
    const password = await bcrypt.hash(credentials.password, 12);
    const user = await User.create({ name, email: credentials.email, password });
    createSession(res, user);
    return res.status(201).json({ user: publicUser(user) });
  } catch (error) {
    return next(error);
  }
});

router.post('/login', async (req, res, next) => {
  const credentials = validateCredentials(req, res);
  if (!credentials) return;

  try {
    const user = await User.findOne({ email: credentials.email }).select('+password');
    if (!user || !(await bcrypt.compare(credentials.password, user.password))) {
      return res.status(401).json({ error: 'Email or password is incorrect' });
    }
    createSession(res, user);
    return res.json({ user: publicUser(user) });
  } catch (error) {
    return next(error);
  }
});

router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(401).json({ error: 'User account no longer exists' });
    return res.json({ user: publicUser(user) });
  } catch (error) {
    return next(error);
  }
});

router.post('/logout', (req, res) => {
  const options = cookieOptions();
  delete options.maxAge;
  res.clearCookie(cookieName, options);
  return res.json({ message: 'Logged out' });
});

module.exports = router;
