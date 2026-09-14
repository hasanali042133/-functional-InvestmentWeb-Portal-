import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { AppError } from '../utils/AppError.js';
import { sendError } from '../utils/apiResponse.js';
import { isProduction } from '../config/env.js';

export const notFoundHandler = (req, res) =>
  sendError(res, {
    status: 404,
    message: `Route ${req.method} ${req.originalUrl} does not exist.`,
    code: 'ROUTE_NOT_FOUND',
  });

/* eslint-disable-next-line no-unused-vars -- Express identifies error handlers by arity */
export const errorHandler = (err, req, res, next) => {
  if (err instanceof AppError) {
    return sendError(res, {
      status: err.statusCode,
      message: err.message,
      code: err.code,
      errors: err.details,
    });
  }

  // Validation that escaped the `validate` middleware (e.g. inside a service).
  if (err instanceof ZodError) {
    return sendError(res, {
      status: 422,
      message: 'Please correct the highlighted fields.',
      code: 'VALIDATION_ERROR',
      errors: err.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      })),
    });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // P2002 — unique constraint violation
    if (err.code === 'P2002') {
      const field = err.meta?.target?.[0] ?? 'value';
      return sendError(res, {
        status: 409,
        message: `That ${field} is already in use.`,
        code: 'DUPLICATE_VALUE',
      });
    }
    // P2025 — record required for the operation was not found
    if (err.code === 'P2025') {
      return sendError(res, {
        status: 404,
        message: 'The requested record was not found.',
        code: 'NOT_FOUND',
      });
    }
  }

  if (err?.type === 'entity.parse.failed') {
    return sendError(res, {
      status: 400,
      message: 'Request body is not valid JSON.',
      code: 'INVALID_JSON',
    });
  }

  // Anything else is unexpected: log it for us, stay generic for the client.
  console.error('[unhandled error]', err);

  return sendError(res, {
    status: 500,
    message: 'Something went wrong on our end. Please try again.',
    code: 'INTERNAL_SERVER_ERROR',
    errors: isProduction ? undefined : { detail: err?.message },
  });
};
