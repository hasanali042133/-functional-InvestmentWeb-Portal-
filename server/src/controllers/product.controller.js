import { asyncHandler, sendSuccess } from '../utils/apiResponse.js';
import * as productService from '../services/product.service.js';
import { toProductSummary, toProductDetail } from '../utils/serializers.js';

/** GET /api/products */
export const getProducts = asyncHandler(async (req, res) => {
  const products = await productService.listProducts();

  return sendSuccess(res, {
    message: 'Investment products retrieved.',
    data: { products: products.map(toProductSummary) },
  });
});

/** GET /api/products/:id */
export const getProduct = asyncHandler(async (req, res) => {
  const product = await productService.getProductById(req.params.id);

  return sendSuccess(res, {
    message: 'Product details retrieved.',
    data: { product: toProductDetail(product) },
  });
});
