import { ImageAnnotation, ShapeType } from '@annotorious/annotorious';
import { AnnotationPage, Canvas } from '@iiif/presentation-3';
import i18n from '@/i18n';
import { Rect } from 'openseadragon';
import {
  Annotation,
  createAnnotation,
  createBodies,
  ElementType,
  getAnnotationType,
  getAnnotationValue,
} from '../models/Annotation';
import { convertAnnotationPageToW3CAnnotations } from '../models/converters/iiif';
import { getAnnotationRepository } from '../repositories/indexeddb/dbFactory';
import { getImage } from './canvas';

/**
 * This function checks if the annotation is contained in the annotationContainer
 * @param annotationContainer The container of the annotation
 * @param annotation The annotation to check
 * @returns true if the annotation is contained in the annotationContainer.
 * If the annotation is the same as the annotationContainer, it returns false
 */
const contains = (annotationContainer: ImageAnnotation, annotation: ImageAnnotation) => {
  if (annotationContainer.id === annotation.id) {
    return false;
  }

  const container = annotationContainer.target.selector.geometry.bounds;
  const target = annotation.target.selector.geometry.bounds;
  return (
    container.minX <= target.minX &&
    container.minY <= target.minY &&
    container.maxX >= target.maxX &&
    container.maxY >= target.maxY
  );
};

const generateRegionAnnotationForCanvas = (canvas: Canvas, collectionId: string) => {
  const image = getImage(canvas);
  if (image.width === undefined || image.height === undefined) {
    throw new Error(i18n.t('error_image_dimensions'));
  }
  return createAnnotation({
    canvasId: canvas.id,
    collectionId: collectionId,
    order: 1,
    minX: 0,
    minY: 0,
    maxX: image.width,
    maxY: image.height,
    type: ElementType.TEXT_REGION,
    value: '',
  });
};

function generateFirstAnnotation(
  canvases: Canvas[],
  collectionId: string,
  existingCanvasIds: string[] = [],
) {
  const annotations = [];
  for (const canvas of canvases) {
    //si l'élément est déjà dans la liste, on ne lui ajoute pas de nouvelle annotation
    if (existingCanvasIds.includes(canvas.id)) {
      continue;
    }
    try {
      annotations.push(generateRegionAnnotationForCanvas(canvas, collectionId));
    } catch (e) {
      // console.error(e);
    }
  }
  return annotations.filter((elt) => elt !== null);
}

//TODO! ? ça fait redit avec la fonction dans AnnotationRepository
async function getAnnotationsByType(type: ElementType, canvasId: string, collectionId: string) {
  return await getAnnotationRepository().getByScopeAndTypes({ canvasId, collectionId }, [type]);
}

function importAnnotationFromJson(aPage: AnnotationPage, collectionId: string) {
  console.log(`importAnnotationFromJson in - ${collectionId}: `, aPage);
  const annotationsW3C = convertAnnotationPageToW3CAnnotations(aPage, collectionId);
  console.log(`importAnnotationFromJson out - ${collectionId}: `, annotationsW3C);
  // return await db.annotations.bulkPut(annotationsW3C);
  const annotationRepository = getAnnotationRepository();
  return annotationRepository.addAll(annotationsW3C);
}

const getRectFromBounds = (annotation: Annotation | ImageAnnotation) => {
  const bounds = annotation.target.selector.geometry.bounds;
  return new Rect(bounds.minX, bounds.minY, bounds.maxX - bounds.minX, bounds.maxY - bounds.minY);
};

export {
  contains,
  generateFirstAnnotation,
  generateRegionAnnotationForCanvas,
  getAnnotationsByType,
  getRectFromBounds,
  importAnnotationFromJson,
};
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
export function getTop(annotation: ImageAnnotation) {
  return getPosition(annotation).y;
}
export function getBottom(annotation: ImageAnnotation) {
  const pos = getPosition(annotation);
  const dim = getDimensions(annotation);
  return pos.y + dim.height;
}
export function getLeft(annotation: ImageAnnotation) {
  return getPosition(annotation).x;
}
export function getRight(annotation: ImageAnnotation) {
  const pos = getPosition(annotation);
  const dim = getDimensions(annotation);
  return pos.x + dim.width;
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
