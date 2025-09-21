// server.js
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const flash = require('connect-flash');
const passport = require('passport');
const dotenv = require('dotenv');
const fs = require('fs');

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 8080;

// Debug environment variables
console.log({
  PORT: process.env.PORT,
  MONGO_URI: process.env.MONGO_URI ? 'Set' : 'Missing',
  JWT_SECRET: process.env.JWT_SECRET ? 'Set' : 'Missing',
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? 'Set' : 'Missing',
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? 'Set' : 'Missing',
  FACEBOOK_CLIENT_ID: process.env.FACEBOOK_CLIENT_ID ? 'Set' : 'Missing',
  FACEBOOK_CLIENT_SECRET: process.env.FACEBOOK_CLIENT_SECRET ? 'Set' : 'Missing',
  TWITTER_API_KEY: process.env.TWITTER_API_KEY ? 'Set' : 'Missing',
  TWITTER_API_SECRET: process.env.TWITTER_API_SECRET ? 'Set' : 'Missing',
  LINKEDIN_CLIENT_ID: process.env.LINKEDIN_CLIENT_ID ? 'Set' : 'Missing',
  LINKEDIN_CLIENT_SECRET: process.env.LINKEDIN_CLIENT_SECRET ? 'Set' : 'Missing',
  INSTAGRAM_CLIENT_ID: process.env.INSTAGRAM_CLIENT_ID ? 'Set' : 'Missing',
  INSTAGRAM_CLIENT_SECRET: process.env.INSTAGRAM_CLIENT_SECRET ? 'Set' : 'Missing',
});

// Validate environment variables
if (!process.env.MONGO_URI ||
    !process.env.JWT_SECRET ||
    !process.env.GOOGLE_CLIENT_ID ||
    !process.env.GOOGLE_CLIENT_SECRET ||
    !process.env.FACEBOOK_CLIENT_ID ||
    !process.env.FACEBOOK_CLIENT_SECRET ||
    !process.env.TWITTER_API_KEY ||
    !process.env.TWITTER_API_SECRET ||
    !process.env.LINKEDIN_CLIENT_ID ||
    !process.env.LINKEDIN_CLIENT_SECRET ||
    !process.env.INSTAGRAM_CLIENT_ID ||
    !process.env.INSTAGRAM_CLIENT_SECRET) {
  console.error('FATAL ERROR: Missing required environment variables');
  process.exit(1);
}

// Create uploads directory
const publicDir = 'D:\\OneDrive\\Desktop\\projects\\octopus\\public';
const uploadsDir = path.join(publicDir, 'Uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log(`📁 Created uploads directory at ${uploadsDir}`);
}

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use('/Uploads', express.static(uploadsDir));
app.use(express.static(publicDir));

// Session and flash setup
app.use(session({
  secret: process.env.JWT_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000, // 1 day
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict'
  }
}));
app.use(flash());

// Passport initialization
app.use(passport.initialize());
app.use(passport.session());
console.log('🔍 Passport initialized');
require('./config/passport');

// Make flash messages available in templates
app.use((req, res, next) => {
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  res.locals.messages = [...res.locals.success, ...res.locals.error];
  next();
});

// View engine setup
app.set('views', 'D:\\OneDrive\\Desktop\\projects\\octopus\\frontend\\views');
app.set('view engine', 'ejs');

// Routes
const userRoutes = require('./routes/user');
app.use('/', userRoutes);

// Home route
app.get('/', (req, res) => {
  return res.render('index.ejs');
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack);
  req.flash('error', 'Internal server error. Please try again.');
  res.redirect('/index');
});

app.listen(PORT, () => {
  console.log(`🚀 Server started at port ${PORT}`);
});