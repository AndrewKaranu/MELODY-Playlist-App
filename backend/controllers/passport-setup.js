const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const bcrypt = require('bcryptjs');
const User = require('../models/userModel');

// Serialize user
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user
passport.deserializeUser((id, done) => {
  User.findById(id, (err, user) => {
    done(err, user);
  });
});

// Local Strategy
passport.use(new LocalStrategy(
  function(username, password, done) {
    User.findOne({ username: username }, async (err, user) => {
      if (err) { return done(err); }
      if (!user) { return done(null, false, { message: 'Incorrect username.' }); }
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) { return done(null, false, { message: 'Incorrect password.' }); }
      return done(null, user);
    });
  }
));

// Google Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: '/api/auth/google/callback'
}, (accessToken, refreshToken, profile, done) => {
  User.findOne({ googleId: profile.id }, (err, existingUser) => {
    if (err) return done(err);
    if (existingUser) {
      return done(null, existingUser);
    } else {
      const newUser = new User({
        googleId: profile.id,
        username: profile.displayName,
        email: profile.emails[0].value
      });
      newUser.save((err) => {
        if (err) return done(err);
        return done(null, newUser);
      });
    }
  });
}));
