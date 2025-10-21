import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

// Error types for categorization
export enum ErrorType {
  VALIDATION = 'VALIDATION_ERROR',
  AUTHENTICATION = 'AUTHENTICATION_ERROR',
  AUTHORIZATION = 'AUTHORIZATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  RATE_LIMIT = 'RATE_LIMIT_ERROR',
  DATABASE = 'DATABASE_ERROR',
  EXTERNAL_SERVICE = 'EXTERNAL_SERVICE_ERROR',
  FILE_UPLOAD = 'FILE_UPLOAD_ERROR',
  INTERNAL = 'INTERNAL_SERVER_ERROR'
}

// Custom error class with additional metadata
export class AppError extends Error {
  public readonly type: ErrorType;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly metadata?: Record<string, any>;

  constructor(
    message: string,
    type: ErrorType = ErrorType.INTERNAL,
    statusCode: number = 500,
    isOperational: boolean = true,
    metadata?: Record<string, any>
  ) {
    super(message);
    this.type = type;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.metadata = metadata;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

// Structured logger for consistent log format
export class StructuredLogger {
  private static formatLogEntry(level: string, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...data
    };
    
    // In production, use JSON format for log aggregation services
    if (process.env.NODE_ENV === 'production') {
      return JSON.stringify(logEntry);
    }
    
    // In development, use readable format
    const dataStr = data ? ` :: ${JSON.stringify(data)}` : '';
    return `[${timestamp}] [${level}] ${message}${dataStr}`;
  }

  static error(message: string, error?: Error | AppError, req?: Request): void {
    const logData: any = {
      errorMessage: error?.message,
      errorType: (error as AppError)?.type,
      errorStack: process.env.NODE_ENV === 'development' ? error?.stack : undefined
    };

    if (req) {
      logData.request = {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userId: (req as any).user?.claims?.sub
      };
    }

    console.error(this.formatLogEntry('ERROR', message, logData));
  }

  static warn(message: string, data?: any): void {
    console.warn(this.formatLogEntry('WARN', message, data));
  }

  static info(message: string, data?: any): void {
    console.log(this.formatLogEntry('INFO', message, data));
  }

  static debug(message: string, data?: any): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(this.formatLogEntry('DEBUG', message, data));
    }
  }
}

// Error response formatter
function formatErrorResponse(error: Error | AppError, isDevelopment: boolean) {
  const appError = error as AppError;
  
  const response: any = {
    error: {
      message: appError.message || 'An unexpected error occurred',
      type: appError.type || ErrorType.INTERNAL,
      timestamp: new Date().toISOString()
    }
  };

  // Include additional details in development
  if (isDevelopment) {
    response.error.stack = error.stack;
    response.error.metadata = appError.metadata;
  }

  return response;
}

// Convert common errors to AppError
export function normalizeError(error: any): AppError {
  // Zod validation errors
  if (error instanceof ZodError) {
    return new AppError(
      'Validation failed',
      ErrorType.VALIDATION,
      400,
      true,
      { errors: error.errors }
    );
  }

  // Database errors
  if (error.code === '23505') { // PostgreSQL unique violation
    return new AppError(
      'Duplicate entry exists',
      ErrorType.CONFLICT,
      409,
      true
    );
  }

  if (error.code === '23503') { // PostgreSQL foreign key violation
    return new AppError(
      'Referenced resource not found',
      ErrorType.NOT_FOUND,
      404,
      true
    );
  }

  // Auth errors
  if (error.message?.toLowerCase().includes('unauthorized')) {
    return new AppError(
      error.message,
      ErrorType.AUTHENTICATION,
      401,
      true
    );
  }

  if (error.message?.toLowerCase().includes('forbidden')) {
    return new AppError(
      error.message,
      ErrorType.AUTHORIZATION,
      403,
      true
    );
  }

  // File upload errors
  if (error.code === 'LIMIT_FILE_SIZE') {
    return new AppError(
      'File size exceeds limit',
      ErrorType.FILE_UPLOAD,
      413,
      true
    );
  }

  // Already an AppError
  if (error instanceof AppError) {
    return error;
  }

  // Default to internal server error
  return new AppError(
    error.message || 'Internal server error',
    ErrorType.INTERNAL,
    error.statusCode || 500,
    false,
    { originalError: error.name }
  );
}

// Async error wrapper to catch errors in async route handlers
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Global error handling middleware
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const appError = normalizeError(err);
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Log the error
  StructuredLogger.error('Request failed', appError, req);

  // Send error response
  res.status(appError.statusCode).json(formatErrorResponse(appError, isDevelopment));
}

// 404 handler middleware
export function notFoundHandler(req: Request, res: Response): void {
  const error = new AppError(
    `Route ${req.originalUrl} not found`,
    ErrorType.NOT_FOUND,
    404
  );

  StructuredLogger.warn('Route not found', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip
  });

  res.status(404).json(formatErrorResponse(error, process.env.NODE_ENV === 'development'));
}