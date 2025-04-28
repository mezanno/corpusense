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
  partfOf?: string;
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

function getAnnotationType(annotation: Annotation) {
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

const URL_CLASSIFYING = '/class';
const URL_TAGGING = '/tag';

export const createAnnotation = (
  annotationDTO: AnnotationCreateDTO | AnnotationWithIdCreateDTO,
) => {
  const annotationId = 'id' in annotationDTO ? annotationDTO.id : uuid();
  return {
    id: annotationId,
    canvasId: annotationDTO.canvasId,
    collectionId: annotationDTO.collectionId,
    order: annotationDTO.order,
    target: {
      annotation: annotationId,
      selector: {
        type: ShapeType.RECTANGLE,
        geometry: {
          bounds: {
            minX: annotationDTO.minX,
            minY: annotationDTO.minY,
            maxX: annotationDTO.maxX,
            maxY: annotationDTO.maxY,
          },
          x: annotationDTO.minX,
          y: annotationDTO.minY,
          w: annotationDTO.maxX - annotationDTO.minX,
          h: annotationDTO.maxY - annotationDTO.minY,
        },
      },
    },
    bodies: [
      {
        purpose: W3CMotivationEnum.Classifying,
        value: annotationDTO.type,
        annotation: annotationId,
        id: annotationId + URL_CLASSIFYING,
      },
      {
        purpose: W3CMotivationEnum.Tagging,
        value: annotationDTO.value,
        annotation: annotationId,
        id: annotationId + URL_TAGGING,
      },
    ],
  } as Annotation;
};

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
    bodies: [
      {
        purpose: W3CMotivationEnum.Classifying,
        value: type,
        annotation: annotation.id,
        id: annotation.id + URL_CLASSIFYING,
      },
      {
        purpose: W3CMotivationEnum.Tagging,
        value: value,
        annotation: annotation.id,
        id: annotation.id + URL_TAGGING,
      },
    ],
  };
};
