import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/AppError.js';
import { toNumber, unitsFor } from '../utils/money.js';
import { generateTxnRef } from '../utils/txnRef.js';
import { getAvailableBalance } from './portfolio.service.js';

export const createInvestment = async ({ userId, productId, amount }) => {
  const product = await prisma.product.findUnique({ where: { id: productId } });

  if (!product || !product.isActive) {
    throw AppError.notFound('That investment product is not available.', 'PRODUCT_NOT_FOUND');
  }

  const minInvestment = toNumber(product.minInvestment);
  if (amount < minInvestment) {
    throw AppError.badRequest(
      `The minimum investment in ${product.name} is PKR ${minInvestment.toLocaleString()}.`,
      'BELOW_MINIMUM_INVESTMENT',
    );
  }

  const availableBalance = await getAvailableBalance(userId);
  if (amount > availableBalance) {
    throw AppError.badRequest(
      `You have PKR ${Math.floor(availableBalance).toLocaleString()} available to invest.`,
      'INSUFFICIENT_BALANCE',
    );
  }

  const nav = toNumber(product.currentNav);
  const units = unitsFor(amount, nav);

  // One transaction: a holding without its transaction record, or the reverse,
  // would leave the customer's history disagreeing with their portfolio.
  return prisma.$transaction(async (tx) => {
    const investment = await tx.investment.create({
      data: {
        userId,
        productId: product.id,
        amountInvested: amount,
        units,
        navAtPurchase: nav,
      },
    });

    const transaction = await tx.transaction.create({
      data: {
        userId,
        investmentId: investment.id,
        productId: product.id,
        txnRef: generateTxnRef(),
        type: 'INVESTMENT',
        amount,
        status: 'COMPLETED',
      },
      include: { product: { select: { name: true } } },
    });

    return { investment, transaction, product };
  });
};

export const listInvestments = (userId) =>
  prisma.investment.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: { product: { select: { id: true, name: true, riskLevel: true, currentNav: true } } },
  });

export const listTransactions = async ({ userId, page, limit }) => {
  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        product: { select: { name: true } },
        // What the money actually bought. Without it a transaction is just an
        // amount and a date, which is not enough to answer "what did I get?".
        investment: { select: { units: true, navAtPurchase: true } },
      },
    }),
    prisma.transaction.count({ where: { userId } }),
  ]);

  return {
    transactions,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
};
