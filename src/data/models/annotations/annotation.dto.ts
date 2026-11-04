import { ImageAnnotation } from '@annotorious/annotorious';
import { ElementType } from './annotation';

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
