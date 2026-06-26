class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    Error.captureStackTrace(this, this.constructor);
  }
}

const catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

const globalErrorHandler = (err, req, res, next) => {
  // Handle plain objects passed to next() (e.g. next({ message, statusCode }))
  if (!(err instanceof Error) && err.statusCode) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message || 'Something went wrong'
    });
  }

  // Set defaults
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Something went wrong';
  let success = false; // all errors default to unsuccessful


  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'File size exceeds the maximum allowed size';
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      message = 'Unexpected file field';
    } else {
      message = 'File upload failed';
    }
    statusCode = 400;
    success = false;
  }


  if (err.message === 'Only image files are allowed!') {
    message = 'Only image files are allowed';
    statusCode = 400;
    success = false;
  }


  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    message = err.name === 'TokenExpiredError' 
      ? 'Sorry the account was logged out due to inactivity, please login again to continue.' 
      : 'Sorry the account was logged out due to inactivity, please login again to continue.';
    statusCode = 401;
    success = false;
  }


  if (err.name === 'SequelizeValidationError') {
    message = err.errors.map((e) => e.message).join(', ');
    statusCode = 400;
    success = false;
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    message = err.errors.map((e) => e.message).join(', ');
    statusCode = 409;
    success = false;
  }

  if (err.name === 'SequelizeForeignKeyConstraintError') {
    message = 'Referenced record not found';
    statusCode = 400;
    success = false;
  }


  if (statusCode >= 500) {
    console.error('SERVER ERROR:', err);
  } else {
    console.log(`ERROR [${statusCode}]:`, err.message);
  }


  return res.status(statusCode).json({
    success,
    message,

    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = { AppError, catchAsync, globalErrorHandler };