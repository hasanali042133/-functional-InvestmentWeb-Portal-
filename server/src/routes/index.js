import { Router } from 'express';
import authRoutes from './auth.routes.js';
import accountRoutes from './account.routes.js';
import productRoutes from './product.routes.js';
import investmentRoutes from './investment.routes.js';
import navRoutes from './nav.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/account', accountRoutes);
router.use('/products', productRoutes);

// Operational, not customer-facing: the endpoint an external scheduler calls to
// move prices where an in-process timer cannot.
router.use('/nav', navRoutes);

// Investments, transactions and portfolio share one module; they are all views
// of the same holdings.
router.use('/', investmentRoutes);

export default router;
