import { toNumber } from './money.js';

// Shaping responses explicitly is what guarantees passwordHash can never leak,
// and converts Decimal columns to plain numbers.

export const toPublicUser = (user) => ({
  id: user.id,
  fullName: user.fullName,
  email: user.email,
  isEmailVerified: user.isEmailVerified,
  createdAt: user.createdAt,
});

export const toProductSummary = (product) => ({
  id: product.id,
  code: product.code,
  name: product.name,
  category: product.category,
  riskLevel: product.riskLevel,
  minInvestment: toNumber(product.minInvestment),
  expectedReturnPct: toNumber(product.expectedReturnPct),
  description: product.description,
  currentNav: toNumber(product.currentNav),
});

const dateOnly = (value) => (value ? value.toISOString().slice(0, 10) : null);

export const toProductDetail = (product) => ({
  ...toProductSummary(product),
  performance: product.performance,
  // Date-only, so charts are not shifted by the viewer's timezone.
  navHistory: (product.navHistory ?? []).map((point) => ({
    date: dateOnly(point.date),
    nav: toNumber(point.nav),
  })),
  intraday: product.intraday ?? null,
  // Full ISO timestamps here, unlike the daily series: an intraday chart is
  // about time of day, so the viewer's own timezone is exactly what it should
  // be drawn in.
  navTicks: (product.navTicks ?? []).map((tick) => ({
    at: tick.recordedAt.toISOString(),
    nav: toNumber(tick.nav),
  })),
});

export const toApplication = (application) => ({
  id: application.id,
  status: application.status,

  fullName: application.fullName,
  fatherName: application.fatherName,
  dateOfBirth: dateOnly(application.dateOfBirth),
  gender: application.gender,
  cnic: application.cnic,
  mobile: application.mobile,
  email: application.email,
  maritalStatus: application.maritalStatus,

  addressLine1: application.addressLine1,
  city: application.city,
  province: application.province,
  country: application.country,
  postalCode: application.postalCode,

  employmentStatus: application.employmentStatus,
  occupation: application.occupation,
  employerName: application.employerName,
  monthlyIncome: toNumber(application.monthlyIncome),
  sourceOfIncome: application.sourceOfIncome,
  expectedInvestmentAmount: toNumber(application.expectedInvestmentAmount),

  investmentObjective: application.investmentObjective,
  riskProfile: application.riskProfile,
  investmentExperience: application.investmentExperience,
  investmentFrequency: application.investmentFrequency,

  termsAccepted: application.termsAccepted,
  submittedAt: application.submittedAt,
  approvedAt: application.approvedAt,
});

export const toDocument = (document) => ({
  id: document.id,
  type: document.type,
  url: document.url,
  mimeType: document.mimeType,
  sizeBytes: document.sizeBytes,
  isCropped: document.isCropped,
  createdAt: document.createdAt,
});

export const toInvestment = (investment) => ({
  id: investment.id,
  productId: investment.productId,
  productName: investment.product?.name,
  amountInvested: toNumber(investment.amountInvested),
  units: toNumber(investment.units),
  navAtPurchase: toNumber(investment.navAtPurchase),
  createdAt: investment.createdAt,
});

export const toTransaction = (transaction) => ({
  id: transaction.id,
  txnRef: transaction.txnRef,
  productId: transaction.productId,
  productName: transaction.product?.name,
  investmentId: transaction.investmentId,
  type: transaction.type,
  amount: toNumber(transaction.amount),
  status: transaction.status,
  createdAt: transaction.createdAt,
  // Null for any transaction that did not create a holding.
  units: toNumber(transaction.investment?.units ?? null),
  navAtPurchase: toNumber(transaction.investment?.navAtPurchase ?? null),
});
