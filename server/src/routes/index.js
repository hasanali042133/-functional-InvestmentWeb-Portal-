import { Router } from 'express';
import authRoutes from './auth.routes.js';
import productRoutes from './product.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/products', productRoutes);

// Registered as they are built:
// router.use('/account', accountRoutes);
// router.use('/investments', investmentRoutes);
// router.use('/portfolio', portfolioRoutes);

export default router;
