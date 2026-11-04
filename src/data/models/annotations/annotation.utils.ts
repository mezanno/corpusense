import { W3CMotivation } from '@iiif/presentation-3';
import { Annotation, ElementType } from './annotation';
import { AnnotationDTO } from './annotation.dto';

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
  const type = getValueForMotivation(annotation, 'classifying');
  return type === undefined ? ElementType.UNKNOWN : convertToElementTypeEnum(type);
}

export function getAnnotationValue(annotation: Annotation) {
  const value = getValueForMotivation(annotation, 'tagging');
  return value === undefined ? '' : getValueForMotivation(annotation, 'tagging');
}
function getValueForMotivation(annotation: Annotation | AnnotationDTO, motivation: W3CMotivation) {
  return annotation.bodies.find((b) => b.purpose === motivation)?.value;
}
