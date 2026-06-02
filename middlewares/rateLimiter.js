const { rateLimit } = require('express-rate-limit');

const rateLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 10,
    message: "Too many requests, please try again after 5 minutes."
})

module.exports = rateLimiter;