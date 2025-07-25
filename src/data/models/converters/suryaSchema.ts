import { z } from 'zod';

const PointSchema = z.tuple([z.number(), z.number()]); // [x, y]

export const suryaLineSchema = z.object({
  polygon: z.array(PointSchema),
  confidence: z.number(),
  text: z.string(),
  chars: z.array(
    z.object({
      polygon: z.array(PointSchema),
      confidence: z.number(),
      text: z.string(),
      bbox_valid: z.boolean(),
      bbox: z.tuple([z.number(), z.number(), z.number(), z.number()]), // [x1, y1, x2, y2]
    }),
  ),
  original_text_good: z.boolean(),
  words: z.array(z.unknown()), // tableau vide pour l'instant
  bbox: z.tuple([z.number(), z.number(), z.number(), z.number()]),
});

export const suryaResultSchema = z.object({
  predictions: z.array(
    z.object({
      text_lines: z.array(suryaLineSchema),
      image_bbox: z.tuple([z.number(), z.number(), z.number(), z.number()]),
    }),
  ),
});

export const peroResultError = z.tuple([
  z.object({
    result: z.object({
      error: z.string(),
    }),
  }),
]);
