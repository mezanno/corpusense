import { ImageAnnotation } from '@annotorious/annotorious';

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
}

export enum ElementType {
  TAG = 'TAG',
  ENTRY = 'ENTRY',
  LINE = 'LINE',
  COLUMN = 'COLUMN',
  PAGE = 'PAGE',
  SECTION = 'SECTION',
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
