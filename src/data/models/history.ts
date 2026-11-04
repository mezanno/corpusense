import z from 'zod';

const HistorySchema = z.object({
  url: z.string(),
});

export type History = z.infer<typeof HistorySchema>;
