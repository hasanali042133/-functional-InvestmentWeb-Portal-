// Success: { success: true, message, data }
// Failure: { success: false, message, code, errors? }

export const sendSuccess = (res, { status = 200, message = 'OK', data = null } = {}) =>
  res.status(status).json({ success: true, message, data });

export const sendCreated = (res, { message = 'Created', data = null } = {}) =>
  sendSuccess(res, { status: 201, message, data });

export const sendError = (res, { status = 500, message, code, errors } = {}) => {
  const body = { success: false, message, code };
  if (errors) body.errors = errors;
  return res.status(status).json(body);
};

/** Sends rejected promises to the Express error handler instead of hanging the request. */
export const asyncHandler = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);
