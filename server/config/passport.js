import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import dotenv from 'dotenv';
import { getDatabase } from './database.js';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const db = await getDatabase();
    const user = await db.collection('users').findOne({ id: id });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google OAuth strategy
// Log Google OAuth configuration for debugging
console.log('🔐 Google OAuth configuration check:');
console.log('   GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'SET' : 'NOT SET');
console.log('   GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 'SET' : 'NOT SET');
console.log('   GOOGLE_CALLBACK_URL:', process.env.GOOGLE_CALLBACK_URL);

// Only setup Google OAuth if credentials are provided
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_CALLBACK_URL) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const db = await getDatabase();
      const usersCollection = db.collection('users');
      
      // Check if user already exists
      const existingUser = await usersCollection.findOne({ email: profile.emails[0].value });
      
      if (existingUser) {
        // User already exists, return the user
        console.log('✅ Existing user logged in with Google:', existingUser.email);
        return done(null, existingUser);
      }
      
      // Create new user
      const newUser = {
        id: `user-${Date.now()}`,
        name: profile.displayName,
        email: profile.emails[0].value,
        initials: profile.displayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      console.log('🆕 Creating new user with Google OAuth:', newUser.email);
      
      const result = await usersCollection.insertOne(newUser);
      
      if (result.insertedId) {
        console.log('✅ New user created with Google OAuth:', newUser.email);
        return done(null, newUser);
      } else {
        console.error('❌ Failed to create user with Google OAuth');
        return done(new Error('Failed to create user'), null);
      }
    } catch (error) {
      console.error('❌ Error in Google OAuth strategy:', error);
      return done(error, null);
    }
  }));
} else {
  console.warn('⚠️ Google OAuth credentials not provided. Google login will be disabled.');
}

export default passport;