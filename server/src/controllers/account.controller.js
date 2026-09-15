import { asyncHandler, sendSuccess, sendCreated } from '../utils/apiResponse.js';
import { AppError } from '../utils/AppError.js';
import * as accountService from '../services/account.service.js';
import * as documentService from '../services/document.service.js';
import { toApplication, toDocument } from '../utils/serializers.js';

const withDocuments = (application) => ({
  application: toApplication(application),
  documents: (application.documents ?? []).map(toDocument),
});

export const getApplication = asyncHandler(async (req, res) => {
  const application = await accountService.getOrCreateApplication(req.user.id);

  return sendSuccess(res, {
    message: 'Application retrieved.',
    data: withDocuments(application),
  });
});

export const getStatus = asyncHandler(async (req, res) =>
  sendSuccess(res, {
    message: 'Account status retrieved.',
    data: await accountService.getStatus(req.user.id),
  }),
);

export const saveApplication = asyncHandler(async (req, res) => {
  const application = await accountService.saveSection(req.user.id, req.body);

  return sendSuccess(res, {
    message: 'Your progress has been saved.',
    data: withDocuments(application),
  });
});

export const submitApplication = asyncHandler(async (req, res) => {
  const application = await accountService.submitApplication(req.user.id);

  return sendSuccess(res, {
    message: 'Your account has been approved. You can now start investing.',
    data: withDocuments(application),
  });
});

export const uploadDocument = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw AppError.badRequest('Choose a file to upload.', 'FILE_REQUIRED');
  }

  const document = await documentService.uploadDocument({
    userId: req.user.id,
    type: req.body.type,
    isCropped: req.body.isCropped,
    file: req.file,
  });

  return sendCreated(res, {
    message: 'Document uploaded.',
    data: { document: toDocument(document) },
  });
});

export const deleteDocument = asyncHandler(async (req, res) => {
  await documentService.deleteDocument({ userId: req.user.id, documentId: req.params.id });

  return sendSuccess(res, { message: 'Document removed.', data: null });
});
