const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Content = require('../models/content'); // Import the new Content model
const auth = require('../middleware/auth');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const aiSuggestionsService = require('../services/aiSuggestions');
const { check, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Multer config (unchanged)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'D:\\OneDrive\\Desktop\\projects\\octopus\\public\\Uploads\\';
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, `${req.user._id}-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) return cb(null, true);
    cb(new Error('Only JPEG/PNG images are allowed'));
  }
});

// ===== Public routes =====
router.get('/signup', (req, res) => res.render('signup', { messages: req.flash() }));
router.get('/login', (req, res) => res.render('login', { messages: req.flash() }));

router.get('/index', (req, res) => {
  const token = req.cookies.token;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      User.findById(decoded.id).select('-password').then(user => {
        if (user) return res.redirect('/dashboard');
        res.clearCookie('token');
        return res.render('index', { messages: req.flash() });
      }).catch(err => {
        console.error('Index error:', err);
        res.clearCookie('token');
        return res.render('index', { messages: req.flash() });
      });
    } catch (err) {
      console.error('Index token error:', err);
      res.clearCookie('token');
      return res.render('index', { messages: req.flash() });
    }
  } else return res.render('index', { messages: req.flash() });
});

// ===== Signup/Login =====
router.post('/signup', [
  check('name', 'Name is required').notEmpty(),
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Password must be at least 6 characters').isLength({ min: 6 }),
  check('confirmPassword', 'Passwords must match').custom((val, { req }) => val === req.body.password)
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.flash('error', errors.array().map(e => e.msg).join(', '));
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
      password: req.body.password,
      socialAccounts: { facebook: null, twitter: null, instagram: null, linkedin: null, youtube: null }
    });

    await user.save();
    const token = user.generateAuthToken();
    res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
    req.flash('success', 'Account created successfully!');
    return res.redirect('/dashboard');
  } catch (err) {
    console.error('Signup error:', err);
    req.flash('error', 'An error occurred during signup');
    return res.redirect('/signup');
  }
});

router.post('/login', [
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Password is required').exists()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.flash('error', errors.array().map(e => e.msg).join(', '));
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
    res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
    req.flash('success', 'Login successful!');
    return res.redirect('/dashboard');
  } catch (err) {
    console.error('Login error:', err);
    req.flash('error', 'An error occurred during login');
    return res.redirect('/login');
  }
});

// ===== Social OAuth =====
const socialAuthOptions = {
  google: { scope: ['profile', 'email'] },
  facebook: { scope: ['public_profile', 'email', 'user_posts'] },
  twitter: {},
  instagram: { scope: ['user_profile', 'user_media'] },
  linkedin: { scope: ['profile', 'email', 'openid'] },
  youtube: { scope: ['https://www.googleapis.com/auth/youtube.readonly', 'https://www.googleapis.com/auth/userinfo.profile', 'https://www.googleapis.com/auth/userinfo.email'] }
};

Object.keys(socialAuthOptions).forEach(platform => {
  router.get(`/auth/${platform}`, (req, res, next) => {
    if (req.isAuthenticated()) {
      auth(req, res, () => passport.authenticate(platform, socialAuthOptions[platform])(req, res, next));
    } else {
      passport.authenticate(platform, socialAuthOptions[platform])(req, res, next);
    }
  });

  router.get(`/auth/${platform}/callback`, 
    passport.authenticate(platform, { failureRedirect: '/login', failureFlash: true }),
    async (req, res) => {
      try {
        console.log(`${platform} callback triggered, user:`, JSON.stringify(req.user, null, 2));
        if (!req.user) {
          throw new Error('No user returned from authentication');
        }
        const token = req.user.generateAuthToken();
        res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
        req.flash('success', `${platform.charAt(0).toUpperCase() + platform.slice(1)} ${req.isAuthenticated() ? 'connected' : 'login'} successful!`);
        res.redirect('/dashboard');
      } catch (err) {
        console.error(`${platform} callback error:`, err.message);
        req.flash('error', `Error with ${platform} ${req.isAuthenticated() ? 'connection' : 'login'}: ${err.message}`);
        res.redirect('/login');
      }
    }
  );
});

// ===== Content Routes =====
router.get('/api/content', auth, async (req, res) => {
  try {
    const contents = await Content.find({ userId: req.user._id })
      .sort({ date: -1 }) // Sort by date descending
      .limit(5); // Limit to 5 most recent
    return res.json(contents);
  } catch (err) {
    console.error('Error fetching content:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch content' });
  }
});

router.post('/api/content', auth, [
  check('title', 'Title is required').notEmpty(),
  check('type', 'Content type is required').isIn(['Blog Post', 'Video', 'Social Media', 'Email']),
  check('status', 'Status is required').isIn(['Published', 'Draft', 'Scheduled']),
  check('date', 'Date must be a valid date').optional().isISO8601()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array().map(e => e.msg).join(', ') });
  }

  try {
    const { title, type, status, date, contentData } = req.body;
    const content = new Content({
      userId: req.user._id,
      title,
      type,
      status,
      date: date || Date.now(),
      contentData: contentData || {}
    });
    await content.save();
    return res.json({ success: true, content });
  } catch (err) {
    console.error('Error creating content:', err);
    return res.status(500).json({ success: false, error: 'Failed to create content' });
  }
});

// ===== Dashboard & other routes =====
function renderWithConnectedAccounts(req, res, view) {
  const connectedAccounts = {
    facebook: !!req.user.socialAccounts?.facebook?.id,
    twitter: !!req.user.socialAccounts?.twitter?.id,
    instagram: !!req.user.socialAccounts?.instagram?.id,
    linkedin: !!req.user.socialAccounts?.linkedin?.id,
    youtube: !!req.user.socialAccounts?.youtube?.id
  };
  console.log('Rendering with connectedAccounts:', connectedAccounts);
  return res.render(view, { messages: req.flash(), user: req.user, connectedAccounts });
}

router.get('/dashboard', auth, (req, res) => renderWithConnectedAccounts(req, res, 'dashboard'));
router.get('/social-accounts', auth, (req, res) => renderWithConnectedAccounts(req, res, 'social_accounts'));
router.get('/content', auth, (req, res) => res.render('content', { messages: req.flash(), user: req.user }));
router.get('/analytics', auth, (req, res) => res.render('analytics', { messages: req.flash(), user: req.user }));
router.get('/gallery', auth, (req, res) => res.render('gallery', { messages: req.flash(), user: req.user }));
router.get('/calendar', auth, (req, res) => res.render('calendar', { messages: req.flash(), user: req.user }));
router.get('/credits', auth, (req, res) => res.render('credits', { messages: req.flash(), user: req.user }));
router.get('/pricing', auth, (req, res) => res.render('pricing', { messages: req.flash(), user: req.user }));
router.get('/settings', auth, (req, res) => res.render('settings', { messages: req.flash(), user: req.user }));

// Settings update route
router.post('/settings', auth, upload.single('profileImage'), [
  check('name', 'Name must be at least 2 characters').isLength({ min: 2 }),
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Password must be at least 6 characters if provided').optional({ checkFalsy: true }).isLength({ min: 6 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: errors.array().map(e => e.msg).join(', ') });

  try {
    const { name, email, password } = req.body;
    const user = await User.findById(req.user._id).select('+password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (email && email !== user.email) {
      const existing = await User.findOne({ email });
      if (existing) return res.status(400).json({ message: 'Email already in use' });
    }

    user.name = name || user.name;
    user.email = email || user.email;
    if (password) user.password = password;
    if (req.file) user.profileImage = `/Uploads/${req.file.filename}`;

    await user.save();
    const token = user.generateAuthToken();
    res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' });

    return res.json({ message: 'Settings updated successfully', profileImage: user.profileImage || 'https://randomuser.me/api/portraits/women/44.jpg', name: user.name, email: user.email });
  } catch (err) {
    console.error('Settings update error:', err);
    return res.status(500).json({ message: 'Error saving settings. Please try again.' });
  }
});

// Disconnect social account
router.post('/social-accounts/disconnect', auth, async (req, res) => {
  try {
    const { platform } = req.body;
    const validPlatforms = ['facebook', 'twitter', 'instagram', 'linkedin', 'youtube'];
    if (!validPlatforms.includes(platform)) {
      req.flash('error', 'Invalid platform specified');
      return res.redirect('/social-accounts');
    }

    const user = await User.findById(req.user._id);
    user.socialAccounts[platform] = null;
    await user.save();

    req.flash('success', `${platform.charAt(0).toUpperCase() + platform.slice(1)} account disconnected successfully!`);
    res.redirect('/social-accounts');
  } catch (err) {
    console.error('Disconnect social account error:', err);
    req.flash('error', `Error disconnecting ${req.body.platform} account`);
    res.redirect('/social-accounts');
  }
});

// ===== AI Suggestions API =====
router.get('/api/trending-suggestions', auth, async (req, res) => {
  try {
    const count = parseInt(req.query.count) || 5;
    const suggestions = await aiSuggestionsService.getTrendingSuggestions(count);
    return res.json({ success: true, suggestions: suggestions.suggestions, fallback: suggestions.fallback || false });
  } catch (err) {
    console.error('Error fetching AI suggestions:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch trending suggestions' });
  }
});

router.post('/api/predict-trend', auth, async (req, res) => {
  try {
    const { hashtag, content_type, platform, region } = req.body;
    const prediction = await aiSuggestionsService.predictTrendPotential(hashtag, content_type, platform, region);
    return res.json(prediction);
  } catch (err) {
    console.error('Error predicting trend:', err);
    return res.status(500).json({ success: false, error: 'Failed to predict trend potential' });
  }
});

// Logout
router.get('/logout', (req, res, next) => {
  res.clearCookie('token');
  req.logout(err => {
    if (err) return next(err);
    req.flash('success', 'Logged out successfully!');
    res.redirect('/login');
  });
});

module.exports = router;