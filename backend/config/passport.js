const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const TwitterStrategy = require('passport-twitter').Strategy;
const LinkedInStrategy = require('passport-linkedin-oauth2').Strategy;
const YouTubeStrategy = require('passport-youtube-v3').Strategy;
const InstagramStrategy = require('passport-instagram').Strategy;
const User = require('../models/user');

// Serialize / Deserialize
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    console.error('Deserialize error:', err);
    done(err, null);
  }
});

// Helper: link provider to current user
async function linkProviderToUser(userId, providerKey, payload) {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    user.socialAccounts = user.socialAccounts || {};
    user.socialAccounts[providerKey] = {
      id: payload.id,
      accessToken: payload.accessToken,
      accessTokenSecret: payload.accessTokenSecret || undefined,
      email: payload.email || undefined,
      username: payload.username || undefined,
    };
    await user.save();
    console.log(`Linked ${providerKey} for user ${userId}:`, user.socialAccounts[providerKey]);
    return user;
  } catch (err) {
    console.error(`Error linking ${providerKey} for user ${userId}:`, err);
    throw err;
  }
}

// Helper: login mode — find existing by provider or email
async function findExistingForLogin(providerKey, profileId, emailMaybe) {
  let user =
    (await User.findOne({ [`socialAccounts.${providerKey}.id`]: profileId })) ||
    (emailMaybe ? await User.findOne({ email: emailMaybe }) : null);
  return user;
}

// GOOGLE
passport.use(
  'google',
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: 'http://localhost:8080/auth/google/callback',
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (req.user) {
          const user = await linkProviderToUser(req.user._id, 'google', {
            id: profile.id,
            accessToken,
            email,
          });
          return done(null, user);
        }
        const existing = await findExistingForLogin('google', profile.id, email);
        if (!existing) {
          return done(null, false, { message: 'No account found. Please sign up and then connect Google.' });
        }
        if (!existing.profileImage && profile._json?.picture) {
          existing.profileImage = profile._json.picture;
          await existing.save();
        }
        return done(null, existing);
      } catch (err) {
        console.error('Google Strategy error:', err);
        return done(err, null);
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
      callbackURL: 'http://localhost:8080/auth/facebook/callback',
      profileFields: ['id', 'displayName', 'emails', 'photos'],
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (req.user) {
          const user = await linkProviderToUser(req.user._id, 'facebook', {
            id: profile.id,
            accessToken,
            email,
            username: profile.displayName,
          });
          return done(null, user);
        }
        const existing = await findExistingForLogin('facebook', profile.id, email);
        if (!existing) {
          return done(null, false, { message: 'No account found. Please login first, then connect Facebook.' });
        }
        return done(null, existing);
      } catch (err) {
        console.error('Facebook Strategy error:', err);
        return done(err, null);
      }
    }
  )
);

// INSTAGRAM
passport.use(
  'instagram',
  new InstagramStrategy(
    {
      clientID: process.env.INSTAGRAM_CLIENT_ID,
      clientSecret: process.env.INSTAGRAM_CLIENT_SECRET,
      callbackURL: 'http://localhost:8080/auth/instagram/callback',
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        const username = profile.username;
        if (req.user) {
          const user = await linkProviderToUser(req.user._id, 'instagram', {
            id: profile.id,
            accessToken,
            username,
          });
          return done(null, user);
        }
        const existing = await findExistingForLogin('instagram', profile.id, null);
        if (!existing) {
          return done(null, false, { message: 'No account found. Please login first, then connect Instagram.' });
        }
        return done(null, existing);
      } catch (err) {
        console.error('Instagram Strategy error:', err);
        return done(err, null);
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
      callbackURL: 'http://localhost:8080/auth/twitter/callback',
      includeEmail: true,
      userProfileURL: 'https://api.twitter.com/1.1/account/verify_credentials.json?include_email=true',
      passReqToCallback: true,
    },
    async (req, token, tokenSecret, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        const username = profile.username;
        if (req.user) {
          const user = await linkProviderToUser(req.user._id, 'twitter', {
            id: profile.id,
            accessToken: token,
            accessTokenSecret: tokenSecret,
            username,
            email,
          });
          return done(null, user);
        }
        const existing = await findExistingForLogin('twitter', profile.id, email);
        if (!existing) {
          return done(null, false, { message: 'No account found. Please login first, then connect Twitter.' });
        }
        return done(null, existing);
      } catch (err) {
        console.error('Twitter Strategy error:', err);
        return done(err, null);
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
      callbackURL: 'http://localhost:8080/auth/linkedin/callback',
      scope: ['r_liteprofile', 'r_emailaddress', 'w_member_social'],
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (req.user) {
          const user = await linkProviderToUser(req.user._id, 'linkedin', {
            id: profile.id,
            accessToken,
            email,
            username: profile.displayName,
          });
          return done(null, user);
        }
        const existing = await findExistingForLogin('linkedin', profile.id, email);
        if (!existing) {
          return done(null, false, { message: 'No account found. Please login first, then connect LinkedIn.' });
        }
        return done(null, existing);
      } catch (err) {
        console.error('LinkedIn Strategy error:', err);
        return done(err, null);
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
      callbackURL: 'http://localhost:8080/auth/youtube/callback',
      scope: [
        'https://www.googleapis.com/auth/youtube.readonly',
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email',
      ],
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        const email = profile._json?.email;
        if (req.user) {
          const user = await linkProviderToUser(req.user._id, 'youtube', {
            id: profile.id,
            accessToken,
            email,
            username: profile._json?.name,
          });
          return done(null, user);
        }
        const existing = await findExistingForLogin('youtube', profile.id, email);
        if (!existing) {
          return done(null, false, { message: 'No account found. Please login first, then connect YouTube.' });
        }
        return done(null, existing);
      } catch (err) {
        console.error('YouTube Strategy error:', err);
        return done(err, null);
      }
    }
  )
);

module.exports = function () {
  return passport;
};