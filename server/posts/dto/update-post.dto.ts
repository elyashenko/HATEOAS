import { z } from 'zod';

export const UpdatePostSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
});

export type UpdatePostDto = z.infer<typeof UpdatePostSchema>;
