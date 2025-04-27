import passport from 'passport';
import { Strategy as GoogleStrategy, Profile as GoogleProfile } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy, Profile as FacebookProfile } from 'passport-facebook';
import User from '../models/User.model.js'; 
import { env } from './environment.js';
import { logger } from '../utils/logger.js';
import crypto from 'crypto';

// Configure Google Strategy
passport.use(new GoogleStrategy(
  {
    clientID: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${env.API_BASE_URL}/api/v1/users/auth/google/callback`,
    scope: ['profile', 'email'],
    passReqToCallback: false
  },
  async (
    accessToken: string,
    refreshToken: string,
    profile: GoogleProfile,
    done: (error: any, user?: Express.User | false | null) => void
  ) => {
    try {
      const email = profile.emails?.[0]?.value;

      // Handle missing lastName
      const lastName = profile.name?.familyName || 
                      (profile.displayName?.split(' ').length > 1 ? 
                       profile.displayName.split(' ').slice(1).join(' ') : 
                       'Unknown');

      const existingUser = await User.findOne({ 
        $or: [
          { googleId: profile.id },
          { email: email }
        ]
      });

      if (existingUser) {
        if (!existingUser.googleId) {
          existingUser.googleId = profile.id;
          await existingUser.save();
        }
        return done(null, existingUser);
      }

      const randomPassword = crypto.randomBytes(20).toString('hex');

      const newUser = new User({
        googleId: profile.id,
        email: email,
        firstName: profile.name?.givenName || profile.displayName?.split(' ')[0],
        lastName: lastName,
        password: randomPassword,
        emailVerified: true
      });

      await newUser.save();
      return done(null, newUser);
    } catch (error) {
      logger.error(`Google authentication error: ${error}`);
      return done(error as Error);
    }
  }
));

// Configure Facebook Strategy
passport.use(new FacebookStrategy(
  {
    clientID: env.FACEBOOK_APP_ID,
    clientSecret: env.FACEBOOK_APP_SECRET,
    callbackURL: `${env.API_BASE_URL}/auth/facebook/callback`,
    profileFields: ['id', 'emails', 'name']
  },
  async (
    accessToken: string,
    refreshToken: string,
    profile: FacebookProfile,
    done: (error: any, user?: Express.User | false | null) => void
  ) => {
    try {
      const email = profile.emails?.[0]?.value;

      const existingUser = await User.findOne({ 
        $or: [
          { facebookId: profile.id },
          { email: email }
        ]
      });

      if (existingUser) {
        if (!existingUser.facebookId) {
          existingUser.facebookId = profile.id;
          await existingUser.save();
        }
        return done(null, existingUser);
      }

      const randomPassword = crypto.randomBytes(20).toString('hex');

      const newUser = new User({
        facebookId: profile.id,
        email: email,
        firstName: profile.name?.givenName || '',
        lastName: profile.name?.familyName || '',
        password: randomPassword,
        emailVerified: true
      });

      await newUser.save();
      return done(null, newUser);
    } catch (error) {
      logger.error(`Facebook authentication error: ${error}`);
      return done(error as Error);
    }
  }
));

// Serialize and deserialize user
passport.serializeUser((user: Express.User, done) => {
  done(null, (user as IUser)._id.toString());
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

export default passport;
