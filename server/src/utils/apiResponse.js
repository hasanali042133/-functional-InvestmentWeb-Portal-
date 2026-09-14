/**
 * Every endpoint answers with the same envelope so the frontend can handle
 * responses uniformly:
 *
 *   success: { success: true,  message, data }
 *   failure: { success: false, message, code, errors? }
 */

export const sendSuccess = (res, { status = 200, message = 'OK', data = null } = {}) =>
  res.status(status).json({ success: true, message, data });

export const sendCreated = (res, { message = 'Created', data = null } = {}) =>
  sendSuccess(res, { status: 201, message, data });

export const sendError = (res, { status = 500, message, code, errors } = {}) => {
  const body = { success: false, message, code };
  if (errors) body.errors = errors;
  return res.status(status).json(body);
};

/**
 * Wraps an async route handler so rejected promises reach the Express error
 * handler instead of hanging the request. Saves a try/catch in every controller.
 */
export const asyncHandler = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);
