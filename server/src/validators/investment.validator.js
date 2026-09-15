import { z } from 'zod';

export const createInvestmentSchema = z.object({
  productId: z.string({ required_error: 'Choose a product to invest in.' }).uuid('That is not a valid product id.'),
  amount: z.coerce
    .number({ invalid_type_error: 'Enter an amount.', required_error: 'Enter an amount.' })
    .positive('Enter an amount greater than zero.')
    .max(1_000_000_000, 'That amount is too large.'),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});
