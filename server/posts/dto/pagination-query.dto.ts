import { z } from 'zod';

export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  size: z.coerce.number().int().min(1).max(100).default(10),
}).partial();

export type PaginationQueryDto = z.infer<typeof PaginationQuerySchema>;
