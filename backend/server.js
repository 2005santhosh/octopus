const dotenv = require('dotenv');
const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const flash = require('connect-flash');

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 8080;

// Validate environment variables
if (!process.env.MONGO_URI || !process.env.jwtsecret) {
  console.error("FATAL ERROR: Missing required environment variables");
  process.exit(1);
}

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MONGODB CONNECTED SUCCESSFULLY"))
  .catch(err => console.error("❌ MONGODB CONNECTION FAILED:", err.message));

// Session and flash setup
app.use(session({
  secret: process.env.jwtsecret,
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 60000 }
}));
app.use(flash());

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '../frontend')));

// Make flash messages available in templates
app.use((req, res, next) => {
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  next();
});

// View engine setup
app.set('views', path.join(__dirname, '../frontend/views'));
app.set('view engine', 'ejs');

// Routes
const userRoutes = require('./routes/user');
app.use('/', userRoutes);

// Home route
app.get("/", (req, res) => {
  return res.render('index.ejs');
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server started at port ${PORT}`);
});