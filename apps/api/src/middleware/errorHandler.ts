import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Unhandled Error:', err);

  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: err.issues
    });
  }

  // Generic fallback
  return res.status(500).json({
    error: err.message || 'Internal Server Error',
    code: 'INTERNAL_SERVER_ERROR'
  });
};
