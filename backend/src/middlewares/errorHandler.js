const { AppError } = require("../utils/appError");

const notFoundHandler = (req, _res, next) => 
{
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
};

const errorHandler = (error, _req, res, _next) => 
{
  const statusCode = error instanceof AppError ? error.statusCode : 500;
  const message =
  statusCode === 500 ? "Something went wrong while processing the request." : error.message;

  if (statusCode >= 500) 
  {
    // Keep stack traces out of API responses but still log for debugging.
    console.error(error);
  }

  res.status(statusCode).json({ message });
};

module.exports = { notFoundHandler, errorHandler, };
