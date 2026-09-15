import { asyncHandler, sendSuccess, sendCreated } from '../utils/apiResponse.js';
import * as investmentService from '../services/investment.service.js';
import * as portfolioService from '../services/portfolio.service.js';
import { toInvestment, toTransaction } from '../utils/serializers.js';

export const createInvestment = asyncHandler(async (req, res) => {
  const { investment, transaction, product } = await investmentService.createInvestment({
    userId: req.user.id,
    productId: req.body.productId,
    amount: req.body.amount,
  });

  return sendCreated(res, {
    message: `Your investment in ${product.name} was successful.`,
    data: {
      investment: toInvestment({ ...investment, product }),
      transaction: toTransaction({ ...transaction, product }),
    },
  });
});

export const listInvestments = asyncHandler(async (req, res) => {
  const investments = await investmentService.listInvestments(req.user.id);

  return sendSuccess(res, {
    message: 'Investments retrieved.',
    data: { investments: investments.map(toInvestment) },
  });
});

export const listTransactions = asyncHandler(async (req, res) => {
  const { transactions, pagination } = await investmentService.listTransactions({
    userId: req.user.id,
    page: req.query.page,
    limit: req.query.limit,
  });

  return sendSuccess(res, {
    message: 'Transactions retrieved.',
    data: { transactions: transactions.map(toTransaction), pagination },
  });
});

export const getPortfolioSummary = asyncHandler(async (req, res) =>
  sendSuccess(res, {
    message: 'Portfolio summary retrieved.',
    data: await portfolioService.getSummary(req.user.id),
  }),
);

export const getPortfolioPerformance = asyncHandler(async (req, res) =>
  sendSuccess(res, {
    message: 'Portfolio performance retrieved.',
    data: await portfolioService.getPerformance(req.user.id),
  }),
);

/** GET /api/portfolio/risk */
export const getPortfolioRisk = asyncHandler(async (req, res) =>
  sendSuccess(res, {
    message: 'Portfolio risk analysis retrieved.',
    data: await portfolioService.getRiskAnalysis(req.user.id),
  }),
);
