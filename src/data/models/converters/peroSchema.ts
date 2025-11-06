import { z } from 'zod';

export const peroLineSchema = z.object({
  id: z.string(),
  polygon: z.array(z.tuple([z.number(), z.number()])),
  transcription: z.string(),
  transcription_confidence: z.number(),
});

export const peroResultSchema = z.array(
  z.object({
    result: z.object({
      ocr_engine: z.object({
        name: z.string(),
        code_version: z.string(),
        model_version: z.string(),
      }),
      transcriptions: z.array(
        z.object({
          lines: z.array(peroLineSchema),
          region: z.tuple([z.number(), z.number(), z.number(), z.number()]),
        }),
      ),
    }),
  }),
);

export const peroResultError = z.tuple([
  z.object({
    result: z.object({
      error: z.string(),
    }),
  }),
]);
