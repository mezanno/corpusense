import { AnnotationDTO, convertToElementTypeEnum, createAnnotation } from '../Annotation';

export interface EdwinBox {
  id: number;
  parent: number;
  type: string;
  box: number[];
}

function convertEdwinToAnnotation(
  edwinBox: EdwinBox,
  canvasId: string,
  collectionId: string,
  originalWidth: number,
) {
  const multiple = Math.max(originalWidth, 2048) / 2048;

  let type = edwinBox.type.toUpperCase();
  if (type === 'TITLE_LEVEL_1' || type === 'TITLE_LEVEL_2') {
    type = 'ENTRY';
  } else if (type === 'SECTION_LEVEL_1' || type === 'SECTION_LEVEL_2') {
    type = 'REGION';
  } else if (type === 'COLUMN_LEVEL_1' || type === 'COLUMN_LEVEL_2') {
    type = 'COLUMN';
  }

  return createAnnotation({
    canvasId,
    collectionId,
    minX: edwinBox.box[0] * multiple,
    minY: edwinBox.box[1] * multiple,
    maxX: edwinBox.box[0] * multiple + edwinBox.box[2] * multiple,
    maxY: edwinBox.box[1] * multiple + edwinBox.box[3] * multiple,
    type: convertToElementTypeEnum(type),
    value: edwinBox.type,
  });
}

export function convertEdwinResult(
  boxes: EdwinBox[],
  canvasId: string,
  collecionId: string,
  originalWidth: number,
): AnnotationDTO[] {
  return boxes
    .map((b) => convertEdwinToAnnotation(b, canvasId, collecionId, originalWidth))
    .filter(Boolean);
}
