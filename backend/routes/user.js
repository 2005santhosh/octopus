const express = require('express');
const router = express.Router();
const User = require('../models/user');
const auth = require('../middleware/auth');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const aiSuggestionsService = require('../services/aiSuggestions');
const { check, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'D:\\OneDrive\\Desktop\\projects\\octopus\\public\\uploads\\'); // Absolute path
  },
  filename: (req, file, cb) => {
    cb(null, `${req.user._id}-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only JPEG/PNG images are allowed'));
  }
});

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
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
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
router.post(
  '/signup',
  [
    check('name', 'Name is required').notEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password must be at least 6 characters').isLength({ min: 6 }),
    check('confirmPassword', 'Passwords must match').custom((value, { req }) => value === req.body.password)
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      req.flash('error', errors.array().map(err => err.msg).join(', '));
      return res.redirect('/signup');
    }

    try {
      const existingUser = await User.findOne({ email: req.body.email });
      if (existingUser) {
        req.flash('error', 'User with this email already exists');
        return res.redirect('/signup');
      }

      const user = new User({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password
      });

      await user.save();

      const token = user.generateAuthToken();
      res.cookie('token', token, {
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
  }
);

// Login route
router.post(
  '/login',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      req.flash('error', errors.array().map(err => err.msg).join(', '));
      return res.redirect('/login');
    }

    try {
      const user = await User.findOne({ email: req.body.email }).select('+password');
      if (!user) {
        req.flash('error', "User doesn't exist");
        return res.redirect('/login');
      }

      const isMatch = await user.comparePassword(req.body.password);
      if (!isMatch) {
        req.flash('error', 'Invalid credentials');
        return res.redirect('/login');
      }

      const token = user.generateAuthToken();
      res.cookie('token', token, {
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
  }
);

// Google OAuth routes
router.get('/auth/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}));

router.get('/auth/google/callback', passport.authenticate('google', {
  failureRedirect: '/login',
  failureFlash: 'Google authentication failed'
}), async (req, res) => {
  if (!req.user.profileImage && req.user._json && req.user._json.picture) {
    req.user.profileImage = req.user._json.picture;
    await req.user.save();
  }
  const token = req.user.generateAuthToken();
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production'
  });
  req.flash('success', 'Logged in with Google successfully!');
  res.redirect('/dashboard');
});

// Dashboard route
router.get('/dashboard', auth, (req, res) => {
  return res.render('dashboard', { messages: res.locals.messages, user: req.user });
});

// Other protected routes
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

// Settings update route
router.post(
  '/settings',
  auth,
  upload.single('profileImage'),
  [check('name', 'Name must be at least 2 characters').isLength({ min: 2 }),
   check('email', 'Please include a valid email').isEmail(),
   check('password', 'Password must be at least 6 characters if provided')
     .optional()
     .isLength({ min: 6 })],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array().map(err => err.msg).join(', ') });
    }

    try {
      const { name, email, password } = req.body;
      const user = await User.findById(req.user._id);

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      if (email !== user.email) {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          return res.status(400).json({ message: 'Email already in use' });
        }
      }

      user.name = name || user.name;
      user.email = email || user.email;
      if (password) {
        user.password = password;
      }
      // if (req.file) {
      //   user.profileImage = `/uploads/${req.file.filename}`; // Ensure correct path
      // }

      if (req.file) {
  console.log('Uploaded file saved to:', `D:\\OneDrive\\Desktop\\projects\\octopus\\public\\uploads\\${req.file.filename}`);
  user.profileImage = `/uploads/${req.file.filename}`;
}

      await user.save();
      req.user = user;
      req.session.user = user;
      const token = user.generateAuthToken();
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production'
      });

      return res.json({
        message: 'Settings updated successfully',
        profileImage: user.profileImage || 'https://randomuser.me/api/portraits/women/44.jpg',
        name: user.name
      });
    } catch (error) {
      console.error('Settings update error:', error);
      return res.status(500).json({ message: 'Error saving settings. Please try again.' });
    }
  }
);

// API Routes for AI Suggestions
router.get('/api/trending-suggestions', auth, async (req, res) => {
  try {
    const count = parseInt(req.query.count) || 5;
    const suggestions = await aiSuggestionsService.getTrendingSuggestions(count);
    
    return res.json({
      success: true,
      suggestions: suggestions.suggestions,
      fallback: suggestions.fallback || false
    });
  } catch (error) {
    console.error('Error fetching AI suggestions:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch trending suggestions'
    });
  }
});

router.post('/api/predict-trend', auth, async (req, res) => {
  try {
    const { hashtag, content_type, platform, region } = req.body;
    const prediction = await aiSuggestionsService.predictTrendPotential(
      hashtag, content_type, platform, region
    );
    
    return res.json(prediction);
  } catch (error) {
    console.error('Error predicting trend:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to predict trend potential'
    });
  }
});

// Logout route
router.get('/logout', (req, res) => {
  res.clearCookie('token');
  req.logout(() => {
    req.flash('success', 'Logged out successfully!');
    res.redirect('/login');
  });
});

module.exports = router;