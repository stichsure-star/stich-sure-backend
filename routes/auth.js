const router = require('express').Router();
const passport = require('passport');

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback',
  passport.authenticate('google', {
    failureRedirect: process.env.GOOGLE_AUTH_FAILURE_REDIRECT_URL || '/api/v1/auth/login',
    session: false
  }),
  (req, res) => {
    const redirectUrl = new URL(
      process.env.GOOGLE_AUTH_SUCCESS_REDIRECT_URL || `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/google/callback`
    );

    redirectUrl.searchParams.set('token', req.user);
    redirectUrl.searchParams.set('success', 'true');

    return res.redirect(redirectUrl.toString());
  }
);

router.get('/login', (req, res) => {
  return res.status(401).json({
    success: false,
    message: 'Login failed'
  });
});

module.exports = router;
