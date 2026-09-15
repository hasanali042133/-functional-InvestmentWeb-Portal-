import { sendError } from '../utils/apiResponse.js';

/**
 * Validates a request section and replaces it with the parsed result, so
 * controllers receive coerced, known-shape data. Zod strips unknown keys, which
 * stops clients smuggling extra fields into a create or update.
 */
export const validate =
  (schema, source = 'body') =>
  (req, res, next) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      return sendError(res, {
        status: 422,
        message: 'Please correct the highlighted fields.',
        code: 'VALIDATION_ERROR',
        errors: result.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }

    req[source] = result.data;
    return next();
  };
