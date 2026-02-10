import { ImageAnnotation, ShapeType } from '@annotorious/annotorious';
import { v4 as uuid } from 'uuid';

export enum W3CMotivationEnum {
  Assessing = 'assessing',
  Bookmarking = 'bookmarking',
  Classifying = 'classifying',
  Commenting = 'commenting',
  Describing = 'describing',
  Editing = 'editing',
  Highlighting = 'highlighting',
  Identifying = 'identifying',
  Linking = 'linking',
  Moderating = 'moderating',
  Questioning = 'questioning',
  Replying = 'replying',
  Tagging = 'tagging',
}

export enum ElementType {
  UNKNOWN = 'UNKNOWN',
  TEXT_LINE = 'TEXT_LINE',
  TEXT_REGION = 'TEXT_REGION',
  TEMP = 'TEMP',
}

export interface Annotation extends ImageAnnotation {
  canvasId: string;
  collectionId: string;
  order: number;
  type: ElementType;
  partOf?: string;
  previous?: string;
  next?: string;
}

export interface AnnotationDTO extends ImageAnnotation {
  canvasId: string;
  collectionId: string;
  type: ElementType;
}

export interface AnnotationCreateDTO {
  canvasId: string;
  collectionId: string;
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  type: ElementType;
  value: string | undefined;
}

export interface AnnotationWithIdCreateDTO extends AnnotationCreateDTO {
  id: string;
}

// Type guard to check if an object is of type Annotation
// export function isAnnotation(annotation: ImageAnnotation): annotation is Annotation {
//   return (
//     (annotation as Annotation).canvasId !== undefined &&
//     (annotation as Annotation).collectionId !== undefined
//   );
// }
//TODO :à revoir ?
export function isAnnotation(obj: unknown): obj is Annotation {
  if (typeof obj !== 'object' || obj === null) return false;

  const a = obj as Partial<Annotation>;

  // Vérifier d'abord que c'est bien une ImageAnnotation
  const isImageAnnotation =
    typeof a.id === 'string' &&
    // typeof a.body !== 'undefined' && // body existe dans ImageAnnotation
    typeof a.target !== 'undefined'; // target existe aussi

  // Vérifier les propriétés spécifiques à Annotation
  const hasRequiredFields =
    typeof a.canvasId === 'string' &&
    typeof a.collectionId === 'string' &&
    typeof a.order === 'number';
  // typeof a.type === 'string';

  return isImageAnnotation && hasRequiredFields;
}

export function isAnnotationArray(value: unknown): value is Annotation[] {
  return Array.isArray(value) && value.every(isAnnotation);
}

export function convertToElementTypeEnum(str: string | undefined): ElementType {
  if (str === undefined) return ElementType.UNKNOWN;
  return ElementType[str as keyof typeof ElementType] ?? ElementType.UNKNOWN;
}

export function getBodies(annotation: Annotation) {
  return {
    type: getAnnotationType(annotation),
    value: getAnnotationValue(annotation),
  };
}

export function getAnnotationText(annotation: Annotation) {
  return getAnnotationValue(annotation) ?? '';
}

export function getAnnotationType(annotation: Annotation | AnnotationDTO) {
  const type = getValueForMotivation(annotation, W3CMotivationEnum.Classifying);
  return type === undefined ? ElementType.UNKNOWN : convertToElementTypeEnum(type);
}

function getAnnotationValue(annotation: Annotation) {
  const value = getValueForMotivation(annotation, W3CMotivationEnum.Tagging);
  return value === undefined ? '' : getValueForMotivation(annotation, W3CMotivationEnum.Tagging);
}

export function getDimensions(annotation: ImageAnnotation) {
  const selector = annotation.target.selector;
  if (selector.type === ShapeType.RECTANGLE) {
    const geometry = selector.geometry;
    return {
      width: geometry.bounds.maxX - geometry.bounds.minX,
      height: geometry.bounds.maxY - geometry.bounds.minY,
    };
  }
  return { width: -1, height: -1 };
}

export function getPosition(annotation: ImageAnnotation) {
  const selector = annotation.target.selector;
  if (selector.type === ShapeType.RECTANGLE) {
    const geometry = selector.geometry;
    return {
      x: geometry.bounds.minX,
      y: geometry.bounds.minY,
    };
  }
  return { x: 0, y: 0 };
}

function getTop(annotation: ImageAnnotation) {
  return getPosition(annotation).y;
}

function getBottom(annotation: ImageAnnotation) {
  const pos = getPosition(annotation);
  const dim = getDimensions(annotation);
  return pos.y + dim.height;
}

function getLeft(annotation: ImageAnnotation) {
  return getPosition(annotation).x;
}

function getRight(annotation: ImageAnnotation) {
  const pos = getPosition(annotation);
  const dim = getDimensions(annotation);
  return pos.x + dim.width;
}

function contains(a1: ImageAnnotation, a2: ImageAnnotation) {
  const pos1 = getPosition(a1);
  const dim1 = getDimensions(a1);
  const pos2 = getPosition(a2);
  const dim2 = getDimensions(a2);

  return (
    pos2.x >= pos1.x &&
    pos2.y >= pos1.y &&
    pos2.x + dim2.width <= pos1.x + dim1.width &&
    pos2.y + dim2.height <= pos1.y + dim1.height
  );
}

function getVerticalDistanceBetweenAnnotations(a1: ImageAnnotation, a2: ImageAnnotation) {
  if (
    contains(a1, a2) ||
    contains(a2, a1) ||
    (getTop(a2) <= getBottom(a1) && getBottom(a2) >= getTop(a1)) ||
    (getBottom(a2) >= getTop(a1) && getTop(a2) <= getTop(a1))
  ) {
    return 0;
  } else {
    const top1 = getTop(a1);
    const bottom1 = getBottom(a1);
    const top2 = getTop(a2);
    const bottom2 = getBottom(a2);

    if (bottom1 < top2) {
      return top2 - bottom1;
    } else {
      return top1 - bottom2;
    }
  }
}

function getHorizontalDistanceBetweenAnnotations(a1: ImageAnnotation, a2: ImageAnnotation) {
  if (
    contains(a1, a2) ||
    contains(a2, a1) ||
    (getLeft(a2) <= getRight(a1) && getRight(a2) >= getLeft(a1)) ||
    (getRight(a2) >= getLeft(a1) && getLeft(a2) <= getLeft(a1))
  ) {
    return 0;
  } else {
    const left1 = getLeft(a1);
    const right1 = getRight(a1);
    const left2 = getLeft(a2);
    const right2 = getRight(a2);

    if (right1 < left2) {
      return left2 - right1;
    } else {
      return left1 - right2;
    }
  }
}

export function getDistanceBetweenAnnotations(a1: ImageAnnotation, a2: ImageAnnotation) {
  return {
    horizontal: getHorizontalDistanceBetweenAnnotations(a1, a2),
    vertical: getVerticalDistanceBetweenAnnotations(a1, a2),
  };
}

function getValueForMotivation(
  annotation: Annotation | AnnotationDTO,
  motivation: W3CMotivationEnum,
) {
  return annotation.bodies.find((b) => b.purpose === motivation)?.value;
}

export const URL_CLASSIFYING = '/class';
export const URL_TAGGING = '/tag';

export function createAnnotation<T extends AnnotationCreateDTO | AnnotationWithIdCreateDTO>(
  params: T,
): AnnotationDTO {
  const annotationId = (params as AnnotationWithIdCreateDTO).id ?? uuid();
  const { canvasId, collectionId, minX, minY, maxX, maxY, type, value } = params;
  const bounds = { minX, minY, maxX, maxY };

  return {
    id: annotationId,
    canvasId,
    collectionId,
    type,
    target: {
      annotation: annotationId,
      selector: {
        type: ShapeType.RECTANGLE,
        geometry: {
          bounds,
          x: bounds.minX,
          y: bounds.minY,
          w: bounds.maxX - bounds.minX,
          h: bounds.maxY - bounds.minY,
        },
      },
    },
    bodies: createBodies(type, value ?? '', annotationId),
  } as AnnotationDTO;
}

// export const createAnnotationFromExistingAnnotation = ({
//   annotation,
//   type,
//   value,
//   collectionId,
//   canvasId,
// }: {
//   annotation: Annotation;
//   canvasId?: string;
//   collectionId?: string;
//   type: ElementType;
//   value: string;
// }): AnnotationDTO => {
//   return {
//     ...annotation,
//     collectionId: collectionId ?? annotation.collectionId,
//     canvasId: canvasId ?? annotation.canvasId,
//     bodies: createBodies(type, value, annotation.id),
//   };
// };

export const createAnnotationFromAnnotorious = ({
  annotation,
  type,
  value,
  collectionId,
  canvasId,
}: {
  annotation: ImageAnnotation;
  type: ElementType;
  value: string;
  collectionId: string;
  canvasId: string;
}): AnnotationDTO => {
  return {
    ...annotation,
    collectionId,
    canvasId,
    type,
    bodies: createBodies(type, value, annotation.id),
  };
};

//TODO : revoir l'order
export const duplicateAnnotation = (annotation: Annotation, canvasId?: string): Annotation => {
  const newId = uuid();
  return {
    ...annotation,
    id: newId,
    canvasId: canvasId ?? annotation.canvasId,
    bodies: createBodies(
      getAnnotationType(annotation),
      getAnnotationValue(annotation) ?? '',
      newId,
    ),
  };
};

export const changeType = (annotation: Annotation, newType: ElementType): Annotation => {
  return {
    ...annotation,
    type: newType,
    bodies: createBodies(newType, getAnnotationValue(annotation) ?? '', annotation.id),
  };
};

export const createBodies = (type: ElementType, value: string, annotationId: string) => {
  return [
    {
      purpose: W3CMotivationEnum.Classifying,
      value: type,
      annotation: annotationId,
      id: annotationId + URL_CLASSIFYING,
    },
    {
      purpose: W3CMotivationEnum.Tagging,
      value: value,
      annotation: annotationId,
      id: annotationId + URL_TAGGING,
    },
  ];
};

export const mergeTwoAnnotations = (a1: Annotation, a2: Annotation) => {
  return {
    ...a1,
    id: a1.id,
    bodies: createBodies(
      getAnnotationType(a1),
      getAnnotationValue(a1) + ' ' + getAnnotationValue(a2),
      a1.id,
    ),
    target: {
      ...a1.target,
      selector: {
        type: ShapeType.RECTANGLE,
        geometry: {
          bounds: {
            minX: Math.min(getLeft(a1), getLeft(a2)),
            minY: Math.min(getTop(a1), getTop(a2)),
            maxX: Math.max(getRight(a1), getRight(a2)),
            maxY: Math.max(getBottom(a1), getBottom(a2)),
          },
          x: Math.min(getLeft(a1), getLeft(a2)),
          y: Math.min(getTop(a1), getTop(a2)),
          w: Math.max(getRight(a1), getRight(a2)) - Math.min(getLeft(a1), getLeft(a2)),
          h: Math.max(getBottom(a1), getBottom(a2)) - Math.min(getTop(a1), getTop(a2)),
        },
      },
    },
  };
};
