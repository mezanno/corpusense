import { ImageAnnotation, ShapeType } from '@annotorious/annotorious';
import { v4 as uuid } from 'uuid';
export interface Annotation extends ImageAnnotation {
  partfOf?: string;
  canvasId?: string;
  previous?: string;
  next?: string;
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

export interface EdwinBox {
  id: number;
  parent: number;
  type: string;
  box: number[];
}

function convertEdwinToAnnotation(edwinBox: EdwinBox, canvasId: string, originalWidth: number) {
  const multiple = Math.max(originalWidth, 2048) / 2048;
  if (edwinBox.type !== 'ENTRY') {
    return null;
  }
  const id = uuid();
  return {
    canvasId,
    // id: edwinBox.id.toString(),
    id,
    target: {
      selector: {
        type: ShapeType.RECTANGLE,
        geometry: {
          bounds: {
            minX: edwinBox.box[0] * multiple,
            minY: edwinBox.box[1] * multiple,
            maxX: edwinBox.box[0] * multiple + edwinBox.box[2] * multiple,
            maxY: edwinBox.box[1] * multiple + edwinBox.box[3] * multiple,
          },
          x: edwinBox.box[0] * multiple,
          y: edwinBox.box[1] * multiple,
          w: edwinBox.box[2] * multiple,
          h: edwinBox.box[3] * multiple,
        },
      },
      annotation: id,
    },
    bodies: [
      {
        purpose: 'classifying',
        value: ElementType.ENTRY,
        annotation: id,
        id: id + '-c',
      },
    ],
  } as unknown as Annotation;
}

export function convertEdwinResult(
  boxes: EdwinBox[],
  canvasId: string,
  originalWidth: number,
): Annotation[] {
  return boxes
    .map((b) => convertEdwinToAnnotation(b, canvasId, originalWidth))
    .filter(Boolean) as Annotation[];
}
