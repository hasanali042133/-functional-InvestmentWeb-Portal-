import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/AppError.js';
import { applicationFields, REQUIRED_ON_SUBMIT } from '../validators/account.validator.js';

const REQUIRED_DOCUMENTS = ['CNIC_FRONT', 'CNIC_BACK', 'PROOF_OF_ADDRESS'];

/** Every customer has exactly one application; it is created empty on first access. */
export const getOrCreateApplication = async (userId) => {
  const existing = await prisma.application.findUnique({
    where: { userId },
    include: { documents: { orderBy: { createdAt: 'asc' } } },
  });

  if (existing) return existing;

  return prisma.application.create({
    data: { userId },
    include: { documents: true },
  });
};

export const getStatus = async (userId) => {
  const application = await getOrCreateApplication(userId);

  return {
    status: application.status,
    canInvest: application.status === 'APPROVED',
    submittedAt: application.submittedAt,
    approvedAt: application.approvedAt,
    documentsUploaded: application.documents.length,
    documentsRequired: REQUIRED_DOCUMENTS.length,
  };
};

export const saveSection = async (userId, values) => {
  const application = await getOrCreateApplication(userId);

  if (application.status === 'APPROVED') {
    throw AppError.conflict(
      'Your account has already been approved and can no longer be edited.',
      'APPLICATION_LOCKED',
    );
  }

  const data = { ...values, status: 'DRAFT' };
  if (values.dateOfBirth) data.dateOfBirth = new Date(values.dateOfBirth);

  return prisma.application.update({
    where: { id: application.id },
    data,
    include: { documents: { orderBy: { createdAt: 'asc' } } },
  });
};

/**
 * Validates the whole application, then approves it.
 *
 * Approval is automatic for this assessment — there is no reviewer — but the
 * checks below are still the gate, so an incomplete application cannot slip
 * through by calling submit directly.
 */
export const submitApplication = async (userId) => {
  const application = await getOrCreateApplication(userId);

  if (application.status === 'APPROVED') {
    throw AppError.conflict('Your account has already been approved.', 'ALREADY_APPROVED');
  }

  const missingFields = REQUIRED_ON_SUBMIT.filter(
    (field) => application[field] === null || application[field] === undefined,
  );

  if (missingFields.length > 0) {
    throw AppError.badRequest(
      'Some required information is still missing.',
      'APPLICATION_INCOMPLETE',
      missingFields.map((field) => ({ field, message: 'This field is required.' })),
    );
  }

  // Re-run field validation: rows may predate a rule change, and a draft save
  // only ever checked the fields it was given.
  const invalid = [];
  for (const field of REQUIRED_ON_SUBMIT) {
    const value = application[field];
    const result = applicationFields[field].safeParse(
      value instanceof Date ? value.toISOString() : value,
    );
    if (!result.success) {
      invalid.push({ field, message: result.error.issues[0].message });
    }
  }

  if (invalid.length > 0) {
    throw AppError.badRequest('Please correct your details.', 'APPLICATION_INVALID', invalid);
  }

  if (!application.termsAccepted) {
    throw AppError.badRequest(
      'Please confirm the declaration before submitting.',
      'TERMS_NOT_ACCEPTED',
    );
  }

  const uploaded = new Set(application.documents.map((document) => document.type));
  const missingDocuments = REQUIRED_DOCUMENTS.filter((type) => !uploaded.has(type));

  if (missingDocuments.length > 0) {
    throw AppError.badRequest(
      'Please upload all required documents.',
      'DOCUMENTS_MISSING',
      missingDocuments.map((type) => ({ field: type, message: 'This document is required.' })),
    );
  }

  const now = new Date();

  return prisma.application.update({
    where: { id: application.id },
    data: { status: 'APPROVED', submittedAt: application.submittedAt ?? now, approvedAt: now },
    include: { documents: { orderBy: { createdAt: 'asc' } } },
  });
};

export const requireApprovedApplication = async (userId) => {
  const application = await prisma.application.findUnique({
    where: { userId },
    select: { status: true },
  });

  if (application?.status !== 'APPROVED') {
    throw AppError.forbidden(
      'Complete your account opening before investing.',
      'ACCOUNT_NOT_APPROVED',
    );
  }
};
