const GoogleStrategy = require('passport-google-oauth20').Strategy;
const passport = require('passport');
const {Customer} = require('../models');
const jwt = require('jsonwebtoken');

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      passReqToCallback: true,
    },

    async function (request, accessToken, refreshToken, profile, done) {
      try {
        console.log('i am profile :', profile);

        let token;
        const checkUser = await Customer.findOne({
          where: { email: profile._json.email },
        });

        if (checkUser) {
          token = jwt.sign(
            { id: checkUser.id, role: checkUser.role },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
          );
        } else {
          const createUser = await Customer.create({
            firstName: profile._json.given_name,
            lastName: profile._json.given_name,
            email: profile._json.email,
            isEmailVerified: profile._json.email_verified,
            role: 'customer',
          });

          token = jwt.sign(
            { id: createUser.id, role: createUser.role },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
          );
        }

        return done(null, token);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

passport.serializeUser((token, done) => {
  return done(null, token);
});

passport.deserializeUser((token, done) => {
  return done(null, token);
});

module.exports = passport;