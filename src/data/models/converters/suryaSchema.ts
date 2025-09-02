import { z } from 'zod';

const PointSchema = z.tuple([z.number(), z.number()]); // [x, y]

//OCR
export const suryaOcrLineSchema = z.object({
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

export const suryaOcrResultSchema = z.object({
  predictions: z.array(
    z.object({
      text_lines: z.array(suryaOcrLineSchema),
      image_bbox: z.tuple([z.number(), z.number(), z.number(), z.number()]),
    }),
  ),
});

//Layout
export const suryaLayoutBboxSchema = z.object({
  bbox: z.tuple([z.number(), z.number(), z.number(), z.number()]),
  confidence: z.number(),
  label: z.string(),
  polygon: z.array(PointSchema),
  position: z.number(),
  top_k: z.record(z.number()),
});

export const suryaLayoutResultSchema = z.object({
  predictions: z.array(
    z.object({
      bboxes: z.array(suryaLayoutBboxSchema),
      image_bbox: z.tuple([z.number(), z.number(), z.number(), z.number()]),
      sliced: z.boolean(),
    }),
  ),
});

//Table
export const suryaTableCellSchema = z.object({
  bbox: z.tuple([z.number(), z.number(), z.number(), z.number()]),
  cell_id: z.number(),
  col_id: z.number(),
  colspan: z.number(),
  confidence: z.number().nullable(),
  is_header: z.boolean(),
  merge_down: z.boolean(),
  merge_up: z.boolean(),
  polygon: z.array(PointSchema),
  row_id: z.number(),
  rowspan: z.number(),
  text_lines: z.number().nullable(),
  within_row_id: z.number(),
});

export const suryaTableColSchema = z.object({
  bbox: z.tuple([z.number(), z.number(), z.number(), z.number()]),
  col_id: z.number(),
  confidence: z.number().nullable(),
  is_header: z.boolean(),
  polygon: z.array(PointSchema),
});

export const suryaTableRowSchema = z.object({
  bbox: z.tuple([z.number(), z.number(), z.number(), z.number()]),
  confidence: z.number().nullable(),
  is_header: z.boolean(),
  polygon: z.array(PointSchema),
  row_id: z.number(),
});

export const suryaTableUnmergedCellSchema = z.object({
  bbox: z.tuple([z.number(), z.number(), z.number(), z.number()]),
  cell_id: z.number(),
  col_id: z.number(),
  colspan: z.number(),
  confidence: z.number().nullable(),
  is_header: z.boolean(),
  merge_down: z.boolean(),
  merge_up: z.boolean(),
  polygon: z.array(PointSchema),
  row_id: z.number(),
  rowspan: z.number(),
  text_lines: z.number().nullable(),
  within_row_id: z.number(),
});

export const suryaTableResultSchema = z.object({
  predictions: z.array(
    z.object({
      cells: z.array(suryaTableCellSchema),
      cols: z.array(suryaTableColSchema),
      image_bbox: z.tuple([z.number(), z.number(), z.number(), z.number()]),
      rows: z.array(suryaTableRowSchema),
      unmerged_cells: z.array(suryaTableUnmergedCellSchema),
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
