const otpGenerator = require("otp-generator");

const VERIFICATION_OTP_TTL_MINUTES = 5;
const RESET_PASSWORD_OTP_TTL_MINUTES = 5;
const RESEND_OTP_COOLDOWN_SECONDS = 60;

const generateNumericOtp = () =>
  otpGenerator.generate(6, {
    upperCaseAlphabets: false,
    lowerCaseAlphabets: false,
    specialChars: false,
  });

const getOtpExpiryDate = (minutes = VERIFICATION_OTP_TTL_MINUTES) =>
  new Date(Date.now() + minutes * 60 * 1000);

const getResendCooldownKey = (role, email) =>
  `otp_resend_cooldown:${role}:${email.toLowerCase()}`;

const getResendCooldownSeconds = async (redisClient, role, email) => {
  if (!redisClient?.isOpen) {
    return 0;
  }

  const ttl = await redisClient.ttl(getResendCooldownKey(role, email));
  return ttl > 0 ? ttl : 0;
};

const setResendCooldown = async (redisClient, role, email) => {
  if (!redisClient?.isOpen) {
    return;
  }

  await redisClient.set(getResendCooldownKey(role, email), "1", {
    EX: RESEND_OTP_COOLDOWN_SECONDS,
  });
};

module.exports = {
  VERIFICATION_OTP_TTL_MINUTES,
  RESET_PASSWORD_OTP_TTL_MINUTES,
  RESEND_OTP_COOLDOWN_SECONDS,
  generateNumericOtp,
  getOtpExpiryDate,
  getResendCooldownSeconds,
  setResendCooldown,
};
