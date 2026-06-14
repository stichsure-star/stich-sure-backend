const jwt = require('jsonwebtoken');
const { AppError } = require('../utils/errorHandler');

exports.authentication = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return next(new AppError('Authorization header not found', 401));
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            return next(new AppError('Token not found', 401));
        }

        jwt.verify(token, process.env.JWT_SECRET, (err, data) => {
            if (err) {
                if (err.name === 'TokenExpiredError') {
                    return next(new AppError('Session expired, please login again', 401));
                }
                return next(new AppError('Invalid token, please login again', 401));
            }
            req.user = data;
            next();
        });
    } catch (error) {
        next(error);
    }
};
