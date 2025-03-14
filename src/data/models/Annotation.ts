import { ImageAnnotation } from '@annotorious/annotorious';

export interface Annotation extends ImageAnnotation {
  partfOf?: string;
  canvasId: string;
}

export enum ElementType {
  TAG = 'TAG',
  ENTRY = 'ENTRY',
  LINE = 'LINE',
  COLUMN = 'COLUMN',
  PAGE = 'PAGE',
}

export function convertToElementTypeEnum(str: string | undefined): ElementType {
  if (str === undefined) return ElementType.TAG;
  return ElementType[str as keyof typeof ElementType] ?? ElementType.TAG;
}

export function getBodies(annotation: Annotation) {
  if (annotation?.bodies.length == 0) {
    return {
      type: ElementType.TAG,
      value: '',
    };
  }
  if (annotation.bodies[0].purpose === 'classifying') {
    return {
      type: convertToElementTypeEnum(annotation.bodies[0].value),
      value: annotation.bodies[1]?.value ?? '',
    };
  } else {
    return {
      type: convertToElementTypeEnum(annotation.bodies[1].value),
      value: annotation.bodies[0]?.value ?? '',
    };
  }
}
