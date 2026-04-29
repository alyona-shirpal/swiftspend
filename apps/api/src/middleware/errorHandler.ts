import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  const fallbackErr = err as Record<string, unknown>;
  const statusCode = typeof fallbackErr?.statusCode === 'number' ? fallbackErr.statusCode : 500;

  // Generic fallback
  return res.status(statusCode).json({
    error: typeof fallbackErr?.message === 'string' ? fallbackErr.message : 'Internal Server Error',
    code: 'INTERNAL_SERVER_ERROR'
  });
};
