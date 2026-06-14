const router = require('express').Router();
const { upload } = require('../middlewares/multer');
const { authentication } = require('../middlewares/authentication');

// ──────────────────────────────────────────────
// AUTH CONTROLLERS (from original routes/designer.js)
// ──────────────────────────────────────────────
const {
  createDesingner,
  loginDesigner,
  verifyEmail,
  forgetPassword,
  resetPassword,
  resendOTP,
  logOut,
} = require('../controller/designer');
const {
  createDesignerValidator,
  loginValidator,
  verifyEmailValidator,
  forgetPasswordValidator,
  resetPasswordValidator,
} = require('../middlewares/designerValidator');

// ──────────────────────────────────────────────
// PROFILE CONTROLLERS (from new controller/designer.js)
// ──────────────────────────────────────────────
const {
  createOrUpdateProfile,
  getAllProfiles,
  getProfile,
  updateProfile,
  deleteProfile,
  getDashboardStats,
} = require('../controller/designer');

// ──────────────────────────────────────────────
// AUTH ROUTES
// ──────────────────────────────────────────────

router.post('/create', createDesignerValidator, createDesingner);
router.post('/login', loginValidator, loginDesigner);
router.post('/verify', verifyEmailValidator, verifyEmail);
router.post('/resend-otp', resendOTP);
router.post('/forget-password', forgetPasswordValidator, forgetPassword);
router.post('/reset-password', authentication, resetPasswordValidator, resetPassword);
router.post('/logout', authentication, logOut);

// ──────────────────────────────────────────────
// PROFILE ROUTES
// ──────────────────────────────────────────────

router.post('/profile', authentication, upload.single('profilePhoto'), createOrUpdateProfile);
router.get('/', getAllProfiles);
router.get('/profile/:designerId', getProfile);
router.put('/profile', authentication, upload.single('profilePhoto'), updateProfile);
router.delete('/profile', authentication, deleteProfile);
router.get('/dashboard-stats', authentication, getDashboardStats);

// ──────────────────────────────────────────────
// WALLET ROUTES
// ──────────────────────────────────────────────

module.exports = router;
