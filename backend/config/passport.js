// passport.js
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const TwitterStrategy = require('passport-twitter').Strategy;
const LinkedInStrategy = require('passport-linkedin-oauth2').Strategy;
const YouTubeStrategy = require('passport-youtube-v3').Strategy;
const InstagramGraphStrategy = require('passport-instagram-graph').Strategy;
const mongoose = require('mongoose');
const User = require('../models/user');

// Serialize / Deserialize
passport.serializeUser((user, done) => {
  console.log('🔍 Serializing user:', user.id);
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    await ensureDbConnection();
    if (mongoose.connection.readyState !== 1) {
      return done(new Error('Database not connected'), null);
    }
    const user = await User.findById(id).maxTimeMS(30000);
    if (!user) {
      return done(new Error('User not found'), null);
    }
    console.log('🔍 Deserialized user:', id);
    done(null, user);
  } catch (err) {
    console.error('❌ Deserialize error:', err.message);
    done(err, null);
  }
});

// Helper: Check MongoDB connection with retry
async function ensureDbConnection(retries = 5) {
  let attempt = 0;
  while (attempt < retries) {
    if (mongoose.connection.readyState === 1) {
      return;
    }
    console.log(`🔄 Retrying DB connection (attempt ${attempt + 1}/${retries})...`);
    await new Promise(resolve => setTimeout(resolve, 2000));
    attempt++;
  }
  throw new Error('MongoDB connection not established after retries');
}

// Helper: Link provider to existing user or create new user
async function linkOrCreateUser(providerKey, payload) {
  try {
    await ensureDbConnection();
    console.log(`🔍 Processing ${providerKey} for user ${payload.id}`);
    console.log(`🔍 Payload:`, JSON.stringify(payload, null, 2));

    let user = await User.findOne({ [`socialAccounts.${providerKey}.id`]: payload.id }).maxTimeMS(30000);

    if (!user && payload.email) {
      user = await User.findOne({ email: payload.email }).maxTimeMS(30000);
    }

    if (!user) {
      console.log(`🔍 Creating new user for ${providerKey}`);
      user = new User({
        name: payload.username || payload.email?.split('@')[0] || `User_${providerKey}_${payload.id}`,
        email: payload.email || `${providerKey}_${payload.id}@example.com`,
        password: require('crypto').randomBytes(16).toString('hex'),
        socialAccounts: {
          [providerKey]: {
            id: payload.id,
            accessToken: payload.accessToken,
            accessTokenSecret: payload.accessTokenSecret,
            refreshToken: payload.refreshToken,
            email: payload.email,
            username: payload.username,
            profile: payload.profile,
          },
        },
        profileImage: payload.profile?.picture || payload.profile?.profilePicture || '',
      });
    } else {
      console.log(`🔍 Linking ${providerKey} to existing user ${user._id}`);
      user.socialAccounts = user.socialAccounts || {};
      user.socialAccounts[providerKey] = {
        id: payload.id,
        accessToken: payload.accessToken,
        accessTokenSecret: payload.accessTokenSecret,
        refreshToken: payload.refreshToken,
        email: payload.email,
        username: payload.username,
        profile: payload.profile,
      };
      if (!user.profileImage && (payload.profile?.picture || payload.profile?.profilePicture)) {
        user.profileImage = payload.profile.picture || payload.profile.profilePicture;
      }
    }

    await user.save();
    console.log(`✅ Processed ${providerKey} for user ${user._id}`);
    return user;
  } catch (err) {
    console.error(`❌ Error processing ${providerKey}:`, err.message);
    throw err;
  }
}

// GOOGLE
passport.use(
  'google',
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.NODE_ENV === 'production'
        ? 'https://your-actual-domain.com/auth/google/callback'
        : 'http://localhost:8080/auth/google/callback',
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        const payload = {
          id: profile.id,
          accessToken,
          refreshToken,
          email: profile.emails?.[0]?.value,
          username: profile.displayName,
          profile: profile._json,
        };
        const user = await linkOrCreateUser('google', payload);
        return done(null, user);
      } catch (err) {
        console.error('❌ Google Strategy error:', err.message);
        return done(null, false, { message: `Google authentication failed: ${err.message}` });
      }
    }
  )
);

// FACEBOOK
passport.use(
  'facebook',
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
      callbackURL: process.env.NODE_ENV === 'production'
        ? 'https://your-actual-domain.com/auth/facebook/callback'
        : 'http://localhost:8080/auth/facebook/callback',
      profileFields: ['id', 'displayName', 'emails', 'photos'],
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        const payload = {
          id: profile.id,
          accessToken,
          refreshToken,
          email: profile.emails?.[0]?.value,
          username: profile.displayName,
          profile: profile._json,
        };
        const user = await linkOrCreateUser('facebook', payload);
        return done(null, user);
      } catch (err) {
        console.error('❌ Facebook Strategy error:', err.message);
        return done(null, false, { message: `Facebook authentication failed: ${err.message}` });
      }
    }
  )
);

// INSTAGRAM
passport.use(
  'instagram',
  new InstagramGraphStrategy(
    {
      clientID: process.env.INSTAGRAM_CLIENT_ID,
      clientSecret: process.env.INSTAGRAM_CLIENT_SECRET,
      callbackURL: process.env.NODE_ENV === 'production'
        ? 'https://your-actual-domain.com/auth/instagram/callback'
        : 'http://localhost:8080/auth/instagram/callback',
      passReqToCallback: true,
      scope: ['user_profile', 'user_media'],
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        const payload = {
          id: profile.id,
          accessToken,
          refreshToken,
          username: profile.username,
          profile: profile._json,
        };
        const user = await linkOrCreateUser('instagram', payload);
        return done(null, user);
      } catch (err) {
        console.error('❌ Instagram Strategy error:', err.message);
        return done(null, false, { message: `Instagram authentication failed: ${err.message}` });
      }
    }
  )
);

// TWITTER
passport.use(
  'twitter',
  new TwitterStrategy(
    {
      consumerKey: process.env.TWITTER_API_KEY,
      consumerSecret: process.env.TWITTER_API_SECRET,
      callbackURL: process.env.NODE_ENV === 'production'
        ? 'https://your-actual-domain.com/auth/twitter/callback'
        : 'http://localhost:8080/auth/twitter/callback',
      includeEmail: true,
      userProfileURL: 'https://api.twitter.com/1.1/account/verify_credentials.json?include_email=true',
      passReqToCallback: true,
    },
    async (req, token, tokenSecret, profile, done) => {
      try {
        const payload = {
          id: profile.id,
          accessToken: token,
          accessTokenSecret: tokenSecret,
          email: profile.emails?.[0]?.value,
          username: profile.username,
          profile: profile._json,
        };
        const user = await linkOrCreateUser('twitter', payload);
        return done(null, user);
      } catch (err) {
        console.error('❌ Twitter Strategy error:', err.message);
        return done(null, false, { message: `Twitter authentication failed: ${err.message}` });
      }
    }
  )
);

// LINKEDIN
passport.use(
  'linkedin',
  new LinkedInStrategy(
    {
      clientID: process.env.LINKEDIN_CLIENT_ID,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
      callbackURL: process.env.NODE_ENV === 'production'
        ? 'https://your-actual-domain.com/auth/linkedin/callback'
        : 'http://localhost:8080/auth/linkedin/callback',
      scope: ['profile', 'email', 'openid'], // Updated scopes for LinkedIn v2 API
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        console.log('🔍 LinkedIn OAuth profile:', JSON.stringify(profile, null, 2));
        console.log('🔍 LinkedIn accessToken:', accessToken);
        console.log('🔍 LinkedIn refreshToken:', refreshToken);
        console.log('🔍 req.user:', req.user ? req.user._id : 'none');

        const payload = {
          id: profile.id,
          accessToken,
          refreshToken,
          email: profile.emails?.[0]?.value || profile._json?.emailAddress,
          username: profile.displayName || profile._json?.localizedFirstName + ' ' + profile._json?.localizedLastName,
          profile: profile._json,
        };
        console.log('🔍 LinkedIn payload:', JSON.stringify(payload, null, 2));

        const user = await linkOrCreateUser('linkedin', payload);
        return done(null, user);
      } catch (err) {
        console.error('❌ LinkedIn Strategy error:', err.message);
        return done(null, false, { message: `LinkedIn authentication failed: ${err.message}` });
      }
    }
  )
);

// YOUTUBE
passport.use(
  'youtube',
  new YouTubeStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.NODE_ENV === 'production'
        ? 'https://your-actual-domain.com/auth/youtube/callback'
        : 'http://localhost:8080/auth/youtube/callback',
      scope: [
        'https://www.googleapis.com/auth/youtube.readonly',
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email',
      ],
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        const payload = {
          id: profile.id,
          accessToken,
          refreshToken,
          email: profile._json?.email,
          username: profile._json?.name,
          profile: profile._json,
        };
        const user = await linkOrCreateUser('youtube', payload);
        return done(null, user);
      } catch (err) {
        console.error('❌ YouTube Strategy error:', err.message);
        return done(null, false, { message: `YouTube authentication failed: ${err.message}` });
      }
    }
  )
);

module.exports = passport;