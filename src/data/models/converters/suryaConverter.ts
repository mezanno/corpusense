import { z } from 'zod';
import { AnnotationDTO, createAnnotation, ElementType } from '../Annotation';
import {
  suryaLayoutBboxSchema,
  suryaLayoutResultSchema,
  suryaOcrLineSchema,
  suryaOcrResultSchema,
  suryaTableColSchema,
  suryaTableResultSchema,
} from './suryaSchema';

export type SuryaOcrResult = z.infer<typeof suryaOcrResultSchema>;
type SuryaOcrLine = z.infer<typeof suryaOcrLineSchema>;

function convertSuryaOcrLineToAnnotation(
  line: SuryaOcrLine,
  canvasId: string,
  collectionId: string,
): AnnotationDTO {
  return createAnnotation({
    canvasId,
    collectionId,
    // minX: Math.min(...line.polygon.map((point) => point[0])),
    // minY: Math.min(...line.polygon.map((point) => point[1])),
    // maxX: Math.max(...line.polygon.map((point) => point[0])),
    // maxY: Math.max(...line.polygon.map((point) => point[1])),
    minX: line.bbox[0],
    minY: line.bbox[1],
    maxX: line.bbox[2],
    maxY: line.bbox[3],
    type: ElementType.TEXT_LINE,
    value: line.text,
  });
}

export function convertSuryaOcrPredictionsToAnnotations(
  result: SuryaOcrResult,
  canvasId: string,
  collectionId: string,
): AnnotationDTO[] {
  const annotations: AnnotationDTO[] = [];
  for (let i = 0; i < result.predictions[0].text_lines.length; i++) {
    const lines = result.predictions[0].text_lines[i];
    annotations.push(convertSuryaOcrLineToAnnotation(lines, canvasId, collectionId));
  }

  return annotations;
}

export type SuryaLayoutResult = z.infer<typeof suryaLayoutResultSchema>;
type SuryaLayoutBbox = z.infer<typeof suryaLayoutBboxSchema>;

function convertSuryaLayoutBboxToAnnotation(
  bbox: SuryaLayoutBbox,
  canvasId: string,
  collectionId: string,
): AnnotationDTO {
  return createAnnotation({
    canvasId,
    collectionId,
    minX: bbox.bbox[0],
    minY: bbox.bbox[1],
    maxX: bbox.bbox[2],
    maxY: bbox.bbox[3],
    type: ElementType.TEXT_LINE,
    value: bbox.label + ' - ' + bbox.position,
  });
}

export function convertSuryaLayoutPredictionsToAnnotations(
  result: SuryaLayoutResult,
  canvasId: string,
  collectionId: string,
): AnnotationDTO[] {
  const annotations: AnnotationDTO[] = [];
  for (let i = 0; i < result.predictions[0].bboxes.length; i++) {
    const bbox = result.predictions[0].bboxes[i];
    if (bbox.label === 'Text' || bbox.label === 'ListItem') {
      annotations.push(convertSuryaLayoutBboxToAnnotation(bbox, canvasId, collectionId));
    }
  }

  return annotations;
}

export type SuryaTableResult = z.infer<typeof suryaTableResultSchema>;
type SuryaTableCol = z.infer<typeof suryaTableColSchema>;

function convertSuryaTableColToAnnotation(
  col: SuryaTableCol,
  canvasId: string,
  collectionId: string,
): AnnotationDTO {
  return createAnnotation({
    canvasId,
    collectionId,
    minX: col.bbox[0],
    minY: col.bbox[1],
    maxX: col.bbox[2],
    maxY: col.bbox[3],
    type: ElementType.TEXT_REGION,
    value: col.col_id.toString(),
  });
}

export function convertSuryaTablePredictionsToAnnotations(
  result: SuryaTableResult,
  canvasId: string,
  collectionId: string,
): AnnotationDTO[] {
  const annotations: AnnotationDTO[] = [];
  for (let i = 0; i < result.predictions[0].cols.length; i++) {
    const bbox = result.predictions[0].cols[i];
    annotations.push(convertSuryaTableColToAnnotation(bbox, canvasId, collectionId));
  }
  return annotations;
}
