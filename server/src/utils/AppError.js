/**
 * Errors the application raises deliberately. Anything thrown that is not an
 * AppError is treated as unexpected by the error handler and reported as a
 * generic 500, so internal details never leak to the client.
 */
export class AppError extends Error {
  /**
   * @param {number} statusCode HTTP status to return
   * @param {string} message    Message safe to show the customer
   * @param {string} [code]     Stable machine-readable code for the frontend
   * @param {object} [details]  Optional extra payload (e.g. field errors)
   */
  constructor(statusCode, message, code = undefined, details = undefined) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message, code = 'BAD_REQUEST', details) {
    return new AppError(400, message, code, details);
  }

  static unauthorized(message = 'You are not signed in.', code = 'UNAUTHORIZED') {
    return new AppError(401, message, code);
  }

  static forbidden(message = 'You do not have access to this resource.', code = 'FORBIDDEN') {
    return new AppError(403, message, code);
  }

  static notFound(message = 'Resource not found.', code = 'NOT_FOUND') {
    return new AppError(404, message, code);
  }

  static conflict(message, code = 'CONFLICT') {
    return new AppError(409, message, code);
  }

  static tooManyRequests(message, code = 'TOO_MANY_REQUESTS', details) {
    return new AppError(429, message, code, details);
  }
}
