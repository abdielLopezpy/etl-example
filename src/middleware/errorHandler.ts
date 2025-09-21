import { Request, Response, NextFunction } from 'express';
import { AppError, ApiError } from '../types/common';
import { logger } from '../utils/logger';
import { ZodError } from 'zod';

export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Si la respuesta ya fue enviada, delegamos al handler por defecto de Express
  if (res.headersSent) {
    return next(error);
  }

  let statusCode = 500;
  let message = 'Internal Server Error';

  // Manejar diferentes tipos de errores
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
  } else if (error instanceof ZodError) {
    statusCode = 400;
    message = 'Validation Error';
    
    // Log detallado de errores de validación
    logger.warn('Validation error:', {
      path: req.path,
      method: req.method,
      issues: error.issues,
    });
  } else if (error.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid resource ID';
  } else if (error.message.includes('SQLITE_CONSTRAINT')) {
    statusCode = 409;
    message = 'Data constraint violation';
  }

  // Log del error
  if (statusCode >= 500) {
    logger.error('Server error:', {
      error: error.message,
      stack: error.stack,
      path: req.path,
      method: req.method,
      ip: req.ip,
    });
  } else {
    logger.warn('Client error:', {
      error: error.message,
      path: req.path,
      method: req.method,
      statusCode,
      ip: req.ip,
    });
  }

  // Respuesta de error estandarizada
  const errorResponse: ApiError = {
    error: error.name || 'Error',
    message,
    statusCode,
    timestamp: new Date().toISOString(),
  };

  res.status(statusCode).json(errorResponse);
}

// Middleware para capturar errores 404
export function notFoundHandler(req: Request, res: Response): void {
  const errorResponse: ApiError = {
    error: 'Not Found',
    message: `Resource not found: ${req.method} ${req.path}`,
    statusCode: 404,
    timestamp: new Date().toISOString(),
  };

  logger.warn('Resource not found:', {
    path: req.path,
    method: req.method,
    ip: req.ip,
  });

  res.status(404).json(errorResponse);
}

// Middleware para capturar errores asincrónicos
export function asyncHandler<T extends Request, U extends Response>(
  fn: (req: T, res: U, next: NextFunction) => Promise<void>
) {
  return (req: T, res: U, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
