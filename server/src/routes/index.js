import { Router } from 'express';
import authRoutes from './auth.routes.js';

const router = Router();

router.use('/auth', authRoutes);

// Registered as they are built:
// router.use('/account', accountRoutes);
// router.use('/products', productRoutes);
// router.use('/investments', investmentRoutes);
// router.use('/portfolio', portfolioRoutes);

export default router;
