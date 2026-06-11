const router = require('express').Router();
const passport = require('passport');

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback',
  passport.authenticate('google', {
    failureRedirect: '/api/v1/auth/login',
    session: false
  }),
  (req, res) => {
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token: req.user
    });
  }
);

router.get('/login', (req, res) => {
  return res.status(401).json({
    success: false,
    message: 'Login failed'
  });
});

module.exports = router;