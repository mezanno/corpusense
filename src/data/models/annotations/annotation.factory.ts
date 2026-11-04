import { ImageAnnotation, ShapeType } from '@annotorious/annotorious';
import { v4 as uuid } from 'uuid';
import { Annotation, ElementType } from './annotation';
import { AnnotationCreateDTO, AnnotationDTO, AnnotationWithIdCreateDTO } from './annotation.dto';
import { getAnnotationType, getAnnotationValue } from './annotation.utils';

const URL_CLASSIFYING = '/class';
const URL_TAGGING = '/tag';
export const changeType = (annotation: Annotation, newType: ElementType): Annotation => {
  return {
    ...annotation,
    type: newType,
    bodies: createBodies(newType, getAnnotationValue(annotation) ?? '', annotation.id),
  };
};

export const changeValue = (annotation: Annotation, newValue: string): Annotation => {
  return {
    ...annotation,
    bodies: createBodies(getAnnotationType(annotation), newValue, annotation.id),
  };
};

export const createBodies = (type: ElementType, value: string, annotationId: string) => {
  return [
    {
      purpose: 'classifying',
      value: type,
      annotation: annotationId,
      id: annotationId + URL_CLASSIFYING,
    },
    {
      purpose: 'tagging',
      value: value,
      annotation: annotationId,
      id: annotationId + URL_TAGGING,
    },
  ];
};

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
