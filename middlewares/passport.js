const passport = require('passport');
require('dotenv').config()
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { Customer } = require('../models');
const jwt = require('jsonwebtoken')


passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
  },
  async function (request, accessToken, refreshToken, profile, done) {
    try {
        console.log('Profile: ', profile)
        const email = profile._json.email;
        let customer = await Customer.findOne({ where: { email } });
         let token;
        if(customer) {
          token = await jwt.sign({id: customer.id}, process.env.JWT_SECRET, {expiresIn: '2h'})
        }
       
        
        if (!customer) {
          customer = await Customer.create({
            email,
            firstName: profile.name?.givenName || profile._json.given_name || profile._json.name,
            lastName: profile.name?.familyName || profile._json.family_name || '',
            role: 'customer',
            isEmailVerified: profile._json.email_verified || false,
          })
          
        }

        return done(null, customer)
        
    } catch (error) {
        return done(null, error)
    }
  }
));

passport.serializeUser((customer, done) => {
  console.log(customer)
 return done(null, customer.id);
});

passport.deserializeUser(async (id, done) => {
  // console.log(id)
  const customer = await Customer.findByPk(id)

  if (!customer) {
    return done(new Error('Customer not found'), null)
  }
 return done(null, customer)
});

