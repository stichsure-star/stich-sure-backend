const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { Customer } = require('../models');


passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
  },
  async (accessToken, refreshToken, profile, cb) => {
    try {
        console.log('Profile: ', profile)
        const email = profile._json.email;
        let customer = await Customer.findOne({ where: { email } });
        
        if (!customer) {
          customer = await Customer.create({
            firstName: profile.name?.givenName || profile._json.given_name || profile._json.name,
            lastName: profile.name?.familyName || profile._json.family_name || '',
            email,
            password: null,
            role: 'customer',
            isEmailVerified: false,
          })
        }

        return cb(null, customer)
        
    } catch (error) {
        return cb(null, error)
    }
  }
));

passport.serializeUser((customer, cb) => {
  console.log(customer)
  cb(null, customer.id);
});

passport.deserializeUser(async (id, cb) => {
  // console.log(id)
  const customer = await Customer.findByPk(id)

  if (!customer) {
    return cb(new Error('Customer not found'), null)
  }
  cb(null, customer)
});

const profile = passport.authenticate('google', {scope: ['profile', 'email'] })

const loginProfile = passport.authenticate('google', { failureRedirect: '/login', session: false })

module.exports = {passport, profile, loginProfile }
