import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/AppError.js';
import { saveFile, deleteFile } from '../storage/index.js';
import { detectMime } from '../middlewares/upload.js';
import { getOrCreateApplication } from './account.service.js';

const resourceTypeFor = (mimeType) => (mimeType === 'application/pdf' ? 'raw' : 'image');

export const uploadDocument = async ({ userId, type, file, isCropped }) => {
  const application = await getOrCreateApplication(userId);

  if (application.status === 'APPROVED') {
    throw AppError.conflict(
      'Your account has already been approved and its documents can no longer be changed.',
      'APPLICATION_LOCKED',
    );
  }

  const actualMime = detectMime(file.buffer);
  if (!actualMime || actualMime !== file.mimetype) {
    throw AppError.badRequest(
      'That file does not look like the type it claims to be.',
      'FILE_TYPE_MISMATCH',
    );
  }

  const existing = application.documents.find((document) => document.type === type);

  const stored = await saveFile(file.buffer, {
    folder: userId,
    key: type.toLowerCase(),
    mimeType: file.mimetype,
    resourceType: resourceTypeFor(file.mimetype),
  });

  const document = await prisma.document.upsert({
    where: { applicationId_type: { applicationId: application.id, type } },
    create: {
      userId,
      applicationId: application.id,
      type,
      url: stored.url,
      publicId: stored.id,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      isCropped,
    },
    update: {
      url: stored.url,
      publicId: stored.id,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      isCropped,
    },
  });

  // Replacing with a different file type produces a different public id, which
  // would otherwise leave the old asset orphaned.
  if (existing && existing.publicId !== document.publicId) {
    await deleteFile(existing.publicId, resourceTypeFor(existing.mimeType));
  }

  return document;
};

export const deleteDocument = async ({ userId, documentId }) => {
  const document = await prisma.document.findFirst({
    where: { id: documentId, userId },
  });

  if (!document) {
    throw AppError.notFound('That document was not found.', 'DOCUMENT_NOT_FOUND');
  }

  const application = await prisma.application.findUnique({
    where: { id: document.applicationId },
    select: { status: true },
  });

  if (application?.status === 'APPROVED') {
    throw AppError.conflict(
      'Your account has already been approved and its documents can no longer be changed.',
      'APPLICATION_LOCKED',
    );
  }

  await prisma.document.delete({ where: { id: document.id } });
  await deleteFile(document.publicId, resourceTypeFor(document.mimeType));
};
