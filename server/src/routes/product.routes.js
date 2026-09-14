import { Router } from 'express';
import * as productController from '../controllers/product.controller.js';
import { requireAuth } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { productIdParamSchema } from '../validators/product.validator.js';

const router = Router();

// Products are catalogue data, but the brief requires protected APIs to be
// authenticated, and only signed-in customers ever browse them.
router.use(requireAuth);

router.get('/', productController.getProducts);
router.get('/:id', validate(productIdParamSchema, 'params'), productController.getProduct);

export default router;
