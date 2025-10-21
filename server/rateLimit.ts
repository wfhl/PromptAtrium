import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

const createLimiter = (windowMs: number, max: number, message?: string) => {
  return rateLimit({
    windowMs,
    max,
    message: message || 'Too many requests from this IP, please try again later.',
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: (req: Request, res: Response) => {
      res.status(429).json({
        error: message || 'Too many requests from this IP, please try again later.',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    },
    skip: (req: Request) => {
      // Skip rate limiting in development mode for easier testing
      return process.env.NODE_ENV === 'development' && !process.env.ENABLE_RATE_LIMIT;
    }
  });
};

// Different rate limiters for different endpoint types
export const authLimiter = createLimiter(
  15 * 60 * 1000, // 15 minutes
  5, // limit each IP to 5 requests per windowMs
  'Too many authentication attempts. Please try again in 15 minutes.'
);

export const registrationLimiter = createLimiter(
  60 * 60 * 1000, // 1 hour
  3, // limit each IP to 3 registration requests per hour
  'Too many registration attempts. Please try again in an hour.'
);

export const apiLimiter = createLimiter(
  15 * 60 * 1000, // 15 minutes
  100, // limit each IP to 100 requests per windowMs
  'API rate limit exceeded. Please try again later.'
);

export const strictApiLimiter = createLimiter(
  1 * 60 * 1000, // 1 minute
  10, // limit each IP to 10 requests per minute for expensive operations
  'Rate limit exceeded for this operation. Please wait a minute.'
);

export const imageUploadLimiter = createLimiter(
  5 * 60 * 1000, // 5 minutes
  10, // limit each IP to 10 image uploads per 5 minutes
  'Too many image upload attempts. Please wait before uploading more images.'
);

export const promptCreationLimiter = createLimiter(
  5 * 60 * 1000, // 5 minutes
  20, // limit each IP to 20 prompt creations per 5 minutes
  'Too many prompts created. Please wait before creating more prompts.'
);

export const dataExportLimiter = createLimiter(
  60 * 60 * 1000, // 1 hour
  5, // limit each IP to 5 data export requests per hour
  'Too many data export requests. Please try again in an hour.'
);

export const searchLimiter = createLimiter(
  1 * 60 * 1000, // 1 minute
  30, // limit each IP to 30 search requests per minute
  'Too many search requests. Please wait a moment.'
);