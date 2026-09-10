// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    message = `Resource not found with id: ${err.value}`;
    statusCode = 404;
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    message = `Duplicate value for field: ${field}`;
    statusCode = 409;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    message = Object.values(err.errors)
      .map((val) => val.message)
      .join(', ');
    statusCode = 422;
  }

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    message = `File too large. Max allowed: ${process.env.MAX_UPLOAD_SIZE_MB || 20}MB`;
    statusCode = 413;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    message = 'Invalid token.';
    statusCode = 401;
  }
  if (err.name === 'TokenExpiredError') {
    message = 'Token expired.';
    statusCode = 401;
  }

  console.error(`[ERROR] ${statusCode} - ${message}`);

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
