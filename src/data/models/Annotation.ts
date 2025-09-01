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
  TAG = 'TAG',
  ENTRY = 'ENTRY',
  LINE = 'LINE',
  COLUMN = 'COLUMN',
  PAGE = 'PAGE',
  SECTION = 'SECTION',
  REGION = 'REGION',
}

export interface Annotation extends ImageAnnotation {
  canvasId: string;
  collectionId: string;
  order: number;
  partOf?: string;
  previous?: string;
  next?: string;
}

export interface AnnotationDTO extends ImageAnnotation {
  canvasId: string;
  collectionId: string;
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

export function isAnnotation(annotation: ImageAnnotation): annotation is Annotation {
  return (
    (annotation as Annotation).canvasId !== undefined &&
    (annotation as Annotation).collectionId !== undefined
  );
}

export function convertToElementTypeEnum(str: string | undefined): ElementType {
  if (str === undefined) return ElementType.TAG;
  return ElementType[str as keyof typeof ElementType] ?? ElementType.TAG;
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
  return type === undefined ? ElementType.TAG : convertToElementTypeEnum(type);
}

function getAnnotationValue(annotation: Annotation) {
  const value = getValueForMotivation(annotation, W3CMotivationEnum.Tagging);
  return value === undefined ? '' : getValueForMotivation(annotation, W3CMotivationEnum.Tagging);
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
