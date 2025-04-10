import { ShapeType } from '@annotorious/annotorious';
import { v4 as uuid } from 'uuid';
import { Annotation, ElementType, W3CMotivationEnum } from '../Annotation';

export interface EdwinBox {
  id: number;
  parent: number;
  type: string;
  box: number[];
}

const URL_CLASSIFYING = '/class';
const URL_TAGGING = '/tag';

function convertEdwinToAnnotation(edwinBox: EdwinBox, canvasId: string, originalWidth: number) {
  const multiple = Math.max(originalWidth, 2048) / 2048;
  if (edwinBox.type !== 'ENTRY') {
    return null;
  }
  const annotationId = uuid();
  return {
    canvasId,
    // id: edwinBox.id.toString(),
    id: annotationId,
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
      annotation: annotationId,
    },
    bodies: [
      {
        purpose: W3CMotivationEnum.Classifying,
        value: ElementType.ENTRY,
        annotation: annotationId,
        id: annotationId + URL_CLASSIFYING,
      },
      {
        purpose: W3CMotivationEnum.Tagging,
        value: ElementType.ENTRY,
        annotation: annotationId,
        id: annotationId + URL_TAGGING,
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
