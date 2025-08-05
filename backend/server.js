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
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET
});

// Validate environment variables
if (!process.env.MONGO_URI || !process.env.JWT_SECRET || !process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  console.error("FATAL ERROR: Missing required environment variables");
  process.exit(1);
}

// Create uploads directory if it doesn't exist
const publicDir = 'D:\\OneDrive\\Desktop\\projects\\octopus\\public';
const uploadsDir = path.join(publicDir, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log(`📁 Created uploads directory at ${uploadsDir}`);
}

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MONGODB CONNECTED SUCCESSFULLY"))
  .catch(err => console.error("❌ MONGODB CONNECTION FAILED:", err.message));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use('/uploads', express.static(uploadsDir)); // Serve uploads from the correct absolute path
app.use(express.static(publicDir)); // Serve frontend static files from the public folder

// Session and flash setup
app.use(session({
  secret: process.env.JWT_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000, secure: process.env.NODE_ENV === 'production' } // 1 day
}));
app.use(flash());

// Passport initialization
app.use(passport.initialize());
app.use(passport.session());
require('./passport'); // Load Google strategy

// Make flash messages available in templates
app.use((req, res, next) => {
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  res.locals.messages = [...res.locals.success, ...res.locals.error];
  next();
});

// View engine setup
app.set('views', 'D:\\OneDrive\\Desktop\\projects\\octopus\\frontend\\views'); // Absolute path to views
app.set('view engine', 'ejs');

// Routes
const userRoutes = require('./routes/user');
app.use('/', userRoutes);

// Home route
app.get("/", (req, res) => {
  return res.render('index.ejs');
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack);
  res.status(500).json({ message: 'Internal server error. Please try again.' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server started at port ${PORT}`);
});