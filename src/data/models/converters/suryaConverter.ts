import { z } from 'zod';
import { Annotation, createAnnotation, ElementType } from '../Annotation';
import { suryaLineSchema, suryaResultSchema } from './suryaSchema';

export type SuryaResult = z.infer<typeof suryaResultSchema>;
type SuryaLine = z.infer<typeof suryaLineSchema>;

export function convertPeroLineToAnnotation(
  line: SuryaLine,
  canvasId: string,
  collectionId: string,
  order: number,
): Annotation {
  return createAnnotation({
    canvasId,
    collectionId,
    order,
    // minX: Math.min(...line.polygon.map((point) => point[0])),
    // minY: Math.min(...line.polygon.map((point) => point[1])),
    // maxX: Math.max(...line.polygon.map((point) => point[0])),
    // maxY: Math.max(...line.polygon.map((point) => point[1])),
    minX: line.bbox[0],
    minY: line.bbox[1],
    maxX: line.bbox[2],
    maxY: line.bbox[3],
    type: ElementType.LINE,
    value: line.text,
  });
}

export function convertSuryaPredictionsToAnnotations(
  result: SuryaResult,
  canvasId: string,
  collectionId: string,
): Annotation[] {
  const annotations: Annotation[] = [];
  let order = 0;
  for (let i = 0; i < result.predictions[0].text_lines.length; i++) {
    const lines = result.predictions[0].text_lines[i];
    annotations.push(convertPeroLineToAnnotation(lines, canvasId, collectionId, order++));
  }

  return annotations;
}
