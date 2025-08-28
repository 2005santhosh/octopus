const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const SocialAccountSchema = new mongoose.Schema(
  {
    id: String,
    accessToken: String,
    accessTokenSecret: String, // used by Twitter (X) OAuth1
    email: String,
    username: String,
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,})+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      select: false,
    },
    profileImage: {
      type: String,
      default: '',
    },
    socialAccounts: {
      google: SocialAccountSchema,
      facebook: SocialAccountSchema,
      twitter: SocialAccountSchema,
      instagram: SocialAccountSchema,
      linkedin: SocialAccountSchema,
      youtube: SocialAccountSchema,
    },
    isVerified: { type: Boolean, default: false },
    verificationToken: String,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Generate JWT token
userSchema.methods.generateAuthToken = function () {
  const payload = {
    id: this._id,
    email: this.email,
    socialAccounts: {
      google: !!this.socialAccounts?.google,
      facebook: !!this.socialAccounts?.facebook,
      twitter: !!this.socialAccounts?.twitter,
      instagram: !!this.socialAccounts?.instagram,
      linkedin: !!this.socialAccounts?.linkedin,
      youtube: !!this.socialAccounts?.youtube,
    },
  };
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '2h' });
};

module.exports = mongoose.model('User', userSchema);