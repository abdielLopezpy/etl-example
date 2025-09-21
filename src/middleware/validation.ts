import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { AppError } from '../types/common';

// Middleware genérico para validación con Zod
export function validateSchema<T>(schema: ZodSchema<T>, target: 'body' | 'params' | 'query' = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      let dataToValidate;
      
      switch (target) {
        case 'body':
          dataToValidate = req.body;
          break;
        case 'params':
          dataToValidate = req.params;
          break;
        case 'query':
          dataToValidate = req.query;
          break;
        default:
          dataToValidate = req.body;
      }

      const validatedData = schema.parse(dataToValidate);
      
      // Reemplazar los datos originales con los validados
      switch (target) {
        case 'body':
          req.body = validatedData;
          break;
        case 'params':
          req.params = validatedData as any;
          break;
        case 'query':
          req.query = validatedData as any;
          break;
      }
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Crear un mensaje de error más amigable
        const errorMessages = error.issues.map(issue => {
          const path = issue.path.join('.');
          return `${path}: ${issue.message}`;
        });
        
        const appError = new AppError(
          `Validation failed: ${errorMessages.join(', ')}`,
          400
        );
        next(appError);
      } else {
        next(error);
      }
    }
  };
}

// Validación específica para parámetros UUID
import { z } from 'zod';

const UuidParamsSchema = z.object({
  id: z.string().uuid('Invalid UUID format'),
});

export const validateUuidParams = validateSchema(UuidParamsSchema, 'params');

// Validación para paginación en query strings
const PaginationQuerySchema = z.object({
  limit: z.string().optional().transform(val => val ? parseInt(val, 10) : undefined),
  offset: z.string().optional().transform(val => val ? parseInt(val, 10) : undefined),
}).refine(data => {
  if (data.limit !== undefined && (data.limit < 1 || data.limit > 1000)) {
    return false;
  }
  if (data.offset !== undefined && data.offset < 0) {
    return false;
  }
  return true;
}, {
  message: 'Invalid pagination parameters: limit must be 1-1000, offset must be >= 0'
});

export function validatePaginationQuery(req: Request, res: Response, next: NextFunction): void {
  try {
    const validatedData = PaginationQuerySchema.parse(req.query);
    req.query = validatedData as any;
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      const errorMessages = error.issues.map(issue => {
        const path = issue.path.join('.');
        return `${path}: ${issue.message}`;
      });
      
      const appError = new AppError(
        `Validation failed: ${errorMessages.join(', ')}`,
        400
      );
      next(appError);
    } else {
      next(error);
    }
  }
}
