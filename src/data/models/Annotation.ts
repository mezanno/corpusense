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

export interface Annotation extends ImageAnnotation {
  partOf?: string;
  canvasId?: string;
  previous?: string;
  next?: string;
  order?: number;
  collectionId?: string;
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

export function getAnnotationType(annotation: Annotation) {
  const type = getValueForMotivation(annotation, W3CMotivationEnum.Classifying);
  return type === undefined ? ElementType.TAG : convertToElementTypeEnum(type);
}

function getAnnotationValue(annotation: Annotation) {
  const value = getValueForMotivation(annotation, W3CMotivationEnum.Tagging);
  return value === undefined ? '' : getValueForMotivation(annotation, W3CMotivationEnum.Tagging);
}

function getValueForMotivation(annotation: Annotation, motivation: W3CMotivationEnum) {
  return annotation.bodies.find((b) => b.purpose === motivation)?.value;
}

export interface AnnotationCreateDTO {
  canvasId: string;
  collectionId: string;
  order: number;
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

export const URL_CLASSIFYING = '/class';
export const URL_TAGGING = '/tag';

export function createAnnotation<T extends AnnotationCreateDTO | AnnotationWithIdCreateDTO>(
  annotationDTO: T,
): Annotation {
  const annotationId = (annotationDTO as AnnotationWithIdCreateDTO).id ?? uuid();
  const { canvasId, collectionId, order, minX, minY, maxX, maxY, type, value } = annotationDTO;
  const bounds = { minX, minY, maxX, maxY };

  return {
    id: annotationId,
    canvasId,
    collectionId,
    order,
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
  } as Annotation;
}

export const createAnnotationFromExistingAnnotation = ({
  annotation,
  type,
  value,
  collectionId,
  canvasId,
  order,
}: {
  annotation: Annotation;
  canvasId?: string;
  collectionId?: string;
  order?: number;
  type: ElementType;
  value: string;
}): Annotation => {
  return {
    ...annotation,
    collectionId: collectionId ?? annotation.collectionId,
    canvasId: canvasId ?? annotation.canvasId,
    order: order ?? annotation.order,
    bodies: createBodies(type, value, annotation.id),
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
