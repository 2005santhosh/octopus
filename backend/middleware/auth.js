const jwt = require('jsonwebtoken');
const User = require('../models/user');

const auth = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    
    if (!token) {
      req.flash('error', 'Authentication required');
      return res.redirect('/index'); // Changed to redirect to /index
    }
    
    const decoded = jwt.verify(token, process.env.jwtsecret);
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      req.flash('error', 'User not found');
      return res.redirect('/index'); // Changed to redirect to /index
    }
    
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    req.flash('error', 'Invalid token');
    return res.redirect('/index'); // Changed to redirect to /index
  }
};

module.exports = auth;