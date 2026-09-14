import { sendError } from '../utils/apiResponse.js';

/**
 * Validates a request section against a Zod schema and replaces it with the
 * parsed result, so controllers always receive coerced, trimmed, known-shape
 * data. Unknown keys are stripped by Zod objects, which stops clients from
 * smuggling extra fields into a create/update.
 *
 * @param {import('zod').ZodTypeAny} schema
 * @param {'body'|'query'|'params'} source
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
