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
const fs = require('fs');

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'D:\\OneDrive\\Desktop\\projects\\octopus\\public\\Uploads\\';
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, `${req.user._id}-${Date.now()}${path.extname(file.originalname)}`);
  },
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
  },
});

// Public routes
router.get('/signup', (req, res) => res.render('signup', { messages: req.flash() }));
router.get('/login', (req, res) => res.render('login', { messages: req.flash() }));

router.get('/index', (req, res) => {
  const token = req.cookies.token;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      User.findById(decoded.id)
        .select('-password')
        .then((user) => {
          if (user) return res.redirect('/dashboard');
          res.clearCookie('token');
          return res.render('index', { messages: req.flash() });
        })
        .catch((err) => {
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

// Signup/Login (local)
router.post(
  '/signup',
  [
    check('name', 'Name is required').notEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password must be at least 6 characters').isLength({ min: 6 }),
    check('confirmPassword', 'Passwords must match').custom((val, { req }) => val === req.body.password),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      req.flash('error', errors.array().map((e) => e.msg).join(', '));
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
        socialAccounts: {},
      });

      await user.save();
      req.flash('success', 'Account created successfully! You can now log in.');
      return res.redirect('/login');
    } catch (err) {
      console.error('Signup error:', err);
      req.flash('error', 'An error occurred during signup');
      return res.redirect('/signup');
    }
  }
);

router.post(
  '/login',
  [check('email', 'Please include a valid email').isEmail(), check('password', 'Password is required').exists()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      req.flash('error', errors.array().map((e) => e.msg).join(', '));
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
      res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' });
      req.flash('success', 'Login successful!');
      return res.redirect('/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      req.flash('error', 'An error occurred during login');
      return res.redirect('/login');
    }
  }
);

// Social OAuth
router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get(
  '/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login', failureFlash: true }),
  async (req, res) => {
    if (req.user) {
      const token = req.user.generateAuthToken();
      res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' });
      res.render('oauth-callback', { platform: 'Google', success: true });
    } else {
      req.flash('error', 'Google authentication failed');
      res.redirect('/login');
    }
  }
);

router.get('/auth/facebook', auth, passport.authenticate('facebook', { scope: ['public_profile', 'email'] }));
router.get(
  '/auth/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/social-accounts', failureFlash: true }),
  async (req, res) => {
    const token = req.user.generateAuthToken();
    res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' });
    res.render('oauth-callback', { platform: 'Facebook', success: true });
  }
);

router.get('/auth/twitter', auth, passport.authenticate('twitter'));
router.get(
  '/auth/twitter/callback',
  passport.authenticate('twitter', { failureRedirect: '/social-accounts', failureFlash: true }),
  async (req, res) => {
    const token = req.user.generateAuthToken();
    res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' });
    res.render('oauth-callback', { platform: 'Twitter', success: true });
  }
);

router.get('/auth/instagram', auth, passport.authenticate('instagram'));
router.get(
  '/auth/instagram/callback',
  passport.authenticate('instagram', { failureRedirect: '/social-accounts', failureFlash: true }),
  async (req, res) => {
    const token = req.user.generateAuthToken();
    res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' });
    res.render('oauth-callback', { platform: 'Instagram', success: true });
  }
);

router.get('/auth/linkedin', auth, passport.authenticate('linkedin', { scope: ['r_liteprofile', 'r_emailaddress', 'w_member_social'] }));
router.get(
  '/auth/linkedin/callback',
  passport.authenticate('linkedin', { failureRedirect: '/social-accounts', failureFlash: true }),
  async (req, res) => {
    const token = req.user.generateAuthToken();
    res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' });
    res.render('oauth-callback', { platform: 'LinkedIn', success: true });
  }
);

router.get(
  '/auth/youtube',
  auth,
  (req, res, next) => {
    console.log('👉 Redirecting to Google with callback:', 'http://localhost:8080/auth/youtube/callback');
    next();
  },
  passport.authenticate('youtube', {
    scope: [
      'https://www.googleapis.com/auth/youtube.readonly',
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
    ],
  })
);
router.get(
  '/auth/youtube/callback',
  passport.authenticate('youtube', { failureRedirect: '/social-accounts', failureFlash: true }),
  async (req, res) => {
    const token = req.user.generateAuthToken();
    res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' });
    res.render('oauth-callback', { platform: 'YouTube', success: true });
  }
);

// Dashboard & other routes
function renderWithConnectedAccounts(req, res, view) {
  const connectedAccounts = {
    google: !!req.user.socialAccounts?.google,
    facebook: !!req.user.socialAccounts?.facebook,
    twitter: !!req.user.socialAccounts?.twitter,
    instagram: !!req.user.socialAccounts?.instagram,
    linkedin: !!req.user.socialAccounts?.linkedin,
    youtube: !!req.user.socialAccounts?.youtube,
  };
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
router.post(
  '/settings',
  auth,
  upload.single('profileImage'),
  [
    check('name', 'Name must be at least 2 characters').isLength({ min: 2 }),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password must be at least 6 characters if provided').optional({ checkFalsy: true }).isLength({ min: 6 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ message: errors.array().map((e) => e.msg).join(', ') });

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

      return res.json({
        message: 'Settings updated successfully',
        profileImage: user.profileImage || 'https://randomuser.me/api/portraits/women/44.jpg',
        name: user.name,
        email: user.email,
      });
    } catch (err) {
      console.error('Settings update error:', err);
      return res.status(500).json({ message: 'Error saving settings. Please try again.' });
    }
  }
);

// Disconnect social account
router.post('/social-accounts/disconnect', auth, async (req, res) => {
  try {
    const { platform } = req.body;
    const validPlatforms = ['google', 'facebook', 'twitter', 'instagram', 'linkedin', 'youtube'];
    if (!validPlatforms.includes(platform)) {
      return res.status(400).json({ message: 'Invalid platform specified' });
    }

    const user = await User.findById(req.user._id);
    if (!user.socialAccounts) user.socialAccounts = {};
    user.socialAccounts[platform] = undefined;
    await user.save();

    const token = user.generateAuthToken();
    res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' });

    return res.json({ message: `${platform.charAt(0).toUpperCase() + platform.slice(1)} account disconnected successfully` });
  } catch (err) {
    console.error('Disconnect social account error:', err);
    return res.status(500).json({ message: `Error disconnecting ${req.body.platform} account` });
  }
});

// Fetch social accounts API endpoint
router.get('/api/user/social-accounts', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const connectedAccounts = {
      google: !!user.socialAccounts?.google?.id,
      facebook: !!user.socialAccounts?.facebook?.id,
      twitter: !!user.socialAccounts?.twitter?.id,
      instagram: !!user.socialAccounts?.instagram?.id,
      linkedin: !!user.socialAccounts?.linkedin?.id,
      youtube: !!user.socialAccounts?.youtube?.id,
    };
    return res.json({ success: true, connectedAccounts });
  } catch (err) {
    console.error('Error fetching social accounts:', err);
    return res.status(500).json({ message: 'Error fetching social accounts' });
  }
});

// AI Suggestions API
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
  req.logout((err) => {
    if (err) return next(err);
    req.flash('success', 'Logged out successfully!');
    res.redirect('/login');
  });
});

module.exports = router;