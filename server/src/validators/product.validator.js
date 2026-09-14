import { z } from 'zod';

export const productIdParamSchema = z.object({
  id: z
    .string({ required_error: 'A product id is required.' })
    .uuid('That is not a valid product id.'),
});
