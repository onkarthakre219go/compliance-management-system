import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let isOperational = err.isOperational || false;

  // Set default values for unhandled native/library exceptions
  if (!(err instanceof AppError)) {
    logger.error(`[UNHANDLED EXCEPTION] Name: ${err.name} | Message: ${err.message} | Stack: ${err.stack}`);
    message = process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred on our systems' 
      : err.message;
  } else {
    logger.warn(`[OPERATIONAL ERROR] Code: ${statusCode} | Message: ${message}`);
  }

  res.status(statusCode).json({
    status: 'error',
    statusCode,
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
}
