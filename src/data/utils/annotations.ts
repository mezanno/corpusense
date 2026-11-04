import { ImageAnnotation, ShapeType } from '@annotorious/annotorious';
import { Canvas } from '@iiif/presentation-3';
import { Rect } from 'openseadragon';
import { v4 as uuid } from 'uuid';
import { Annotation, ElementType } from '../models/annotations/annotation';
import { createAnnotation, createBodies } from '../models/annotations/annotation.factory';
import { getAnnotationType, getAnnotationValue } from '../models/annotations/annotation.utils';
import { getImage } from './canvas';
import { MissingImageDimensionsError, NothingToMergeError } from './errors';

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

const containsAtLeast2Corners = (
  annotationContainer: ImageAnnotation,
  annotation: ImageAnnotation,
) => {
  if (annotationContainer.id === annotation.id) return false;

  const c = annotationContainer.target.selector.geometry.bounds;
  const t = annotation.target.selector.geometry.bounds;

  let count = 0;

  if (t.minX >= c.minX && t.minX <= c.maxX && t.minY >= c.minY && t.minY <= c.maxY) count++;
  if (t.maxX >= c.minX && t.maxX <= c.maxX && t.minY >= c.minY && t.minY <= c.maxY) count++;
  if (t.minX >= c.minX && t.minX <= c.maxX && t.maxY >= c.minY && t.maxY <= c.maxY) count++;
  if (t.maxX >= c.minX && t.maxX <= c.maxX && t.maxY >= c.minY && t.maxY <= c.maxY) count++;

  return count >= 2;
};

const generateRegionAnnotationForCanvas = (canvas: Canvas, collectionId: string) => {
  const image = getImage(canvas);
  if (image.width === undefined || image.height === undefined) {
    throw new MissingImageDimensionsError({ canvasId: canvas.id });
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

const getRectFromBounds = (annotation: Annotation | ImageAnnotation) => {
  const bounds = annotation.target.selector.geometry.bounds;
  return new Rect(bounds.minX, bounds.minY, bounds.maxX - bounds.minX, bounds.maxY - bounds.minY);
};

export {
  contains,
  containsAtLeast2Corners,
  generateFirstAnnotation,
  generateRegionAnnotationForCanvas,
  getRectFromBounds,
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

export function getSurface(annotation: ImageAnnotation) {
  const dimensions = getDimensions(annotation);
  return dimensions.width * dimensions.height;
}

function getPosition(annotation: ImageAnnotation) {
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
function getBottom(annotation: ImageAnnotation) {
  const pos = getPosition(annotation);
  const dim = getDimensions(annotation);
  return pos.y + dim.height;
}
export function getLeft(annotation: ImageAnnotation) {
  return getPosition(annotation).x;
}
function getRight(annotation: ImageAnnotation) {
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

function getHorizontalDistanceBetweenAnnotationCenters(a1: ImageAnnotation, a2: ImageAnnotation) {
  const center1 = getLeft(a1) + getDimensions(a1).width / 2;
  const center2 = getLeft(a2) + getDimensions(a2).width / 2;
  return Math.abs(center1 - center2);
}

function getVerticalDistanceBetweenAnnotationCenters(a1: ImageAnnotation, a2: ImageAnnotation) {
  const center1 = getTop(a1) + getDimensions(a1).height / 2;
  const center2 = getTop(a2) + getDimensions(a2).height / 2;
  return Math.abs(center1 - center2);
}

export function getDistanceBetweenAnnotations(a1: ImageAnnotation, a2: ImageAnnotation) {
  return {
    horizontal: getHorizontalDistanceBetweenAnnotations(a1, a2),
    vertical: getVerticalDistanceBetweenAnnotations(a1, a2),
  };
}

export function getDistanceBetweenAnnotationCenters(a1: ImageAnnotation, a2: ImageAnnotation) {
  return {
    horizontal: getHorizontalDistanceBetweenAnnotationCenters(a1, a2),
    vertical: getVerticalDistanceBetweenAnnotationCenters(a1, a2),
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

export const scale = (annotations: Annotation[], annotationScale: number): Annotation[] => {
  return annotations.map((annotation) => scaleAnnotation(annotation, annotationScale));
};

export const scaleAnnotation = (annotation: Annotation, annotationScale: number) => {
  const minX = annotation.target.selector.geometry.bounds.minX * annotationScale;
  const minY = annotation.target.selector.geometry.bounds.minY * annotationScale;
  const maxX = annotation.target.selector.geometry.bounds.maxX * annotationScale;
  const maxY = annotation.target.selector.geometry.bounds.maxY * annotationScale;

  return {
    ...annotation,
    target: {
      ...annotation.target,
      selector: {
        type: ShapeType.RECTANGLE,
        geometry: {
          bounds: {
            minX,
            minY,
            maxX,
            maxY,
          },
          x: minX,
          y: minY,
          h: maxY - minY,
          w: maxX - minX,
        },
      },
    },
  };
};

/*
 This function takes an array of annotations and merges them into one annotation that contains all the text of the annotations and has a bounding box that contains all the annotations.
 The bounding box is calculated by making boolean operations on the rectangles of the annotations. The text is merged by concatenating the text of the annotations with a space in between.
 The function assumes that the annotations are of type TEXT_LINE and that they are on the same canvas and collection.
*/
export const mergeMultipleAnnotations = (annotations: Annotation[]): Annotation => {
  if (annotations.length === 0) {
    throw new NothingToMergeError();
  }
  //TODO make a polygon that contains all the rectangles instead of a rectangle that contains all the rectangles
  const mergedAnnotation = annotations.reduce((acc, annotation) =>
    mergeTwoAnnotations(acc, annotation),
  );
  return { ...mergedAnnotation, id: uuid() };
};
