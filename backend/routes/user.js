const express = require('express');
const router = express.Router();
const User = require('../models/user');
const auth = require('../middleware/auth');
const jwt = require('jsonwebtoken');

// Render signup page
router.get('/signup', (req, res) => {
  return res.render('signup', { messages: res.locals.messages });
});

// Render login page
router.get('/login', (req, res) => {
  return res.render('login', { messages: res.locals.messages });
});

// Render index page for non-logged-in users, redirect to dashboard for logged-in users
router.get('/index', (req, res, next) => {
  const token = req.cookies.token;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.jwtsecret);
      User.findById(decoded.id).select('-password').then(user => {
        if (user) {
          return res.redirect('/dashboard');
        } else {
          res.clearCookie('token');
          return res.render('index', { messages: res.locals.messages });
        }
      }).catch(error => {
        console.error('Index route error:', error);
        res.clearCookie('token');
        return res.render('index', { messages: res.locals.messages });
      });
    } catch (error) {
      console.error('Index route token error:', error);
      res.clearCookie('token');
      return res.render('index', { messages: res.locals.messages });
    }
  } else {
    return res.render('index', { messages: res.locals.messages });
  }
});

// Signup route
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;
    
    if (!name || !email || !password || !confirmPassword) {
      req.flash('error', 'All fields are required');
      return res.redirect('/signup');
    }
    
    if (password !== confirmPassword) {
      req.flash('error', 'Passwords do not match');
      return res.redirect('/signup');
    }
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      req.flash('error', 'User with this email already exists');
      return res.redirect('/signup');
    }
    
    const user = new User({ name, email, password });
    await user.save();
    
    const token = user.generateAuthToken();
    
    res.cookie('token', token, {
      //expires: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production'
    });
    
    req.flash('success', 'Account created successfully!');
    return res.redirect('/login');
  } catch (error) {
    console.error('Signup error:', error);
    req.flash('error', 'An error occurred during signup');
    return res.redirect('/signup');
  }
});

// Login route - redirect to dashboard on success
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      req.flash('error', 'Email and password are required');
      return res.redirect('/login');
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      req.flash('error', "User doesn't exist");
      return res.redirect('/login');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      req.flash('error', 'Invalid credentials');
      return res.redirect('/login');
    }

    const token = user.generateAuthToken();
    
    res.cookie('token', token, {
      //expires: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production'
    });
    
    req.flash('success', 'Login successful!');
    return res.redirect('/dashboard');
  } catch (error) {
    console.error('Login error:', error);
    req.flash('error', 'An error occurred during login');
    return res.redirect('/login');
  }
});

// Dashboard route - protected by auth middleware
router.get('/dashboard', auth, (req, res) => {
  return res.render('dashboard', { messages: res.locals.messages, user: req.user });
});

// New routes for other pages - protected by auth middleware
router.get('/content', auth, (req, res) => {
  return res.render('content', { messages: res.locals.messages, user: req.user });
});

router.get('/analytics', auth, (req, res) => {
  return res.render('analytics', { messages: res.locals.messages, user: req.user });
});

router.get('/gallery', auth, (req, res) => {
  return res.render('gallery', { messages: res.locals.messages, user: req.user });
});

router.get('/calendar', auth, (req, res) => {
  return res.render('calendar', { messages: res.locals.messages, user: req.user });
});

router.get('/social-accounts', auth, (req, res) => {
  return res.render('social_accounts', { messages: res.locals.messages, user: req.user });
});

router.get('/credits', auth, (req, res) => {
  return res.render('credits', { messages: res.locals.messages, user: req.user });
});

router.get('/pricing', auth, (req, res) => {
  return res.render('pricing', { messages: res.locals.messages, user: req.user });
});

router.get('/settings', auth, (req, res) => {
  return res.render('settings', { messages: res.locals.messages, user: req.user });
});

// Logout route
router.get('/logout', (req, res) => {
  res.clearCookie('token');
  req.flash('success', 'Logged out successfully!');
  return res.redirect('/login');
});

module.exports = router;