import { Router } from 'express';
import authRoutes from './auth.routes.js';
import accountRoutes from './account.routes.js';
import productRoutes from './product.routes.js';
import investmentRoutes from './investment.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/account', accountRoutes);
router.use('/products', productRoutes);

// Investments, transactions and portfolio share one module; they are all views
// of the same holdings.
router.use('/', investmentRoutes);

export default router;
