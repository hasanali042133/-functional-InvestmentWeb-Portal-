import { Router } from 'express';
import * as investmentController from '../controllers/investment.controller.js';
import { requireAuth } from '../middlewares/auth.js';
import { requireApprovedAccount } from '../middlewares/requireApprovedAccount.js';
import { validate } from '../middlewares/validate.js';
import { createInvestmentSchema, paginationSchema } from '../validators/investment.validator.js';

const router = Router();

router.use(requireAuth);

router.post(
  '/investments',
  requireApprovedAccount,
  validate(createInvestmentSchema),
  investmentController.createInvestment,
);

router.get('/investments', investmentController.listInvestments);

router.get(
  '/transactions',
  validate(paginationSchema, 'query'),
  investmentController.listTransactions,
);

router.get('/portfolio/summary', investmentController.getPortfolioSummary);
router.get('/portfolio/performance', investmentController.getPortfolioPerformance);
router.get('/portfolio/risk', investmentController.getPortfolioRisk);

export default router;
