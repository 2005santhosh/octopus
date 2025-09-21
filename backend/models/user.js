const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const SocialAccountSchema = new mongoose.Schema(
  {
    id: { type: String, required: false },
    accessToken: { type: String, required: false },
    accessTokenSecret: { type: String, required: false },
    refreshToken: { type: String, required: false },
    email: { type: String, required: false },
    username: { type: String, required: false },
    profile: { type: Object, required: false },
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
      default: ''
    },
    socialAccounts: {
      google: { type: SocialAccountSchema, default: null },
      facebook: { type: SocialAccountSchema, default: null },
      twitter: { type: SocialAccountSchema, default: null },
      instagram: { type: SocialAccountSchema, default: null },
      linkedin: { type: SocialAccountSchema, default: null },
      youtube: { type: SocialAccountSchema, default: null },
    },
    isVerified: { type: Boolean, default: false },
    verificationToken: String,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    credits: { type: Number, default: 0 },
    initialCreditsGranted: { type: Boolean, default: false },
    isPremium: { type: Boolean, default: false }
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

// Compare password
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
      google: !!this.socialAccounts?.google?.id,
      facebook: !!this.socialAccounts?.facebook?.id,
      twitter: !!this.socialAccounts?.twitter?.id,
      instagram: !!this.socialAccounts?.instagram?.id,
      linkedin: !!this.socialAccounts?.linkedin?.id,
      youtube: !!this.socialAccounts?.youtube?.id,
    },
  };
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '2h' });
};

module.exports = mongoose.model('User', userSchema);