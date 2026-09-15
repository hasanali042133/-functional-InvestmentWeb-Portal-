import { asyncHandler } from '../utils/apiResponse.js';
import { requireApprovedApplication } from '../services/account.service.js';

/** Blocks investing until the customer's account opening application is approved. */
export const requireApprovedAccount = asyncHandler(async (req, res, next) => {
  await requireApprovedApplication(req.user.id);
  return next();
});
