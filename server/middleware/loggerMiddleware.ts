import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();
  const { method, originalUrl, ip } = req;

  // Wait for the response headers to be written
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const { statusCode } = res;
    
    let logMsg = `${method} ${originalUrl} ${statusCode} - ${duration}ms [IP: ${ip}]`;
    
    if (statusCode >= 500) {
      logger.error(logMsg);
    } else if (statusCode >= 400) {
      logger.warn(logMsg);
    } else {
      logger.info(logMsg);
    }
  });

  next();
}
