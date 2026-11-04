import z from 'zod';

export const TimeStampSchema = z.object({
  id: z.string(),
  createdAt: z.iso.datetime().optional(),
  updatedAt: z.iso.datetime().optional(),
});
