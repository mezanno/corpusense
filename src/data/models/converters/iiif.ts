import { ShapeType } from '@annotorious/annotorious';
import {
  Annotation as AnnotationIIF,
  AnnotationPage,
  AnyMotivation,
  ContentResourceString,
  EmbeddedResource,
} from '@iiif/presentation-3';
import { uniq } from 'lodash';
import { Annotation, convertToElementTypeEnum, W3CMotivationEnum } from '../Annotation';

export const IIIF_CONTEXT = 'http://iiif.io/api/presentation/3/context.json';
export const URL_ANNOTATIONPAGE = 'annotationpage/corpusense';

export function convertW3CAnnotationsToIIIF(annotations: Annotation[]): AnnotationPage {
  if (annotations.length === 0) {
    throw new Error('Annotation is empty');
  }

  const canvasId = annotations[0].canvasId;
  if (canvasId === undefined) {
    throw new Error('CanvasId is undefined');
  }

  const annotationPageId = `${canvasId}/${URL_ANNOTATIONPAGE}`;
  const annotationsIff: AnnotationIIF[] = [];
  for (let i = 0; i < annotations.length; i++) {
    const w3cAnnotation = annotations[i];
    const bounds = w3cAnnotation.target.selector.geometry.bounds;
    const bodies = w3cAnnotation.bodies;
    for (let b = 0; b < bodies.length; b++) {
      const body = bodies[b];
      const iifAnnotation = {
        '@context': IIIF_CONTEXT,
        type: 'Annotation',
        id: `${annotationPageId}/${body.id}`,
        motivation: body.purpose !== undefined ? body.purpose : W3CMotivationEnum.Commenting,
        target: `${canvasId}#xywh=${bounds.minX},${bounds.minY},${bounds.maxX - bounds.minX},${bounds.maxY - bounds.minY}`,
        body: {
          type: 'TextualBody',
          value: body.value,
          format: 'text/plain',
        },
      };

      //@ts-expect-error annotationsIff
      annotationsIff.push(iifAnnotation);
    }
  }

  return {
    '@context': IIIF_CONTEXT,
    id: annotationPageId,
    type: 'AnnotationPage',
    items: annotationsIff,
  };
}

export function convertAnnotationPageToW3CAnnotations(aPage: AnnotationPage): Annotation[] {
  const allItems = aPage.items;
  if (allItems === undefined || allItems.length === 0) {
    throw new Error('Annotation items are undefined or empty');
  }

  const annotations: Annotation[] = [];
  const targets = uniq(allItems.map((i) => i.target));
  for (let r = 0; r < targets.length; r++) {
    const target = targets[r] as ContentResourceString;

    try {
      const { baseUrl, xywh } = extractInformationFromTarget(target);
      const bodies = allItems
        .filter((i) => i.target === target)
        .map((i) => ({
          id: i.id,
          motivation: i.motivation as AnyMotivation, //TODO : revoir les cast
          body: i.body as EmbeddedResource,
        }));
      if (bodies.length !== 2) {
        console.error(
          'Invalid number of bodies: in Corpusense, an annotation must have 2 bodies, one for the value and one for the type',
        );
        continue;
      }

      const { id: idType, value: typeValue } = getBodyIdAndValueForMotivation(
        bodies,
        W3CMotivationEnum.Classifying,
      );
      const type = convertToElementTypeEnum(typeValue);
      const { id: idValue, value: valueValue } = getBodyIdAndValueForMotivation(
        bodies,
        W3CMotivationEnum.Tagging,
      );
      const annotationId = extractAnnotationIdFromBody(idValue);
      const a = {
        id: annotationId,
        canvasId: baseUrl,
        target: {
          annotation: annotationId,
          selector: {
            type: ShapeType.RECTANGLE,
            geometry: {
              bounds: {
                minX: xywh.x,
                minY: xywh.y,
                maxX: xywh.x + xywh.w,
                maxY: xywh.y + xywh.h,
              },
              x: xywh.x,
              y: xywh.y,
              w: xywh.w,
              h: xywh.h,
            },
          },
        },
        bodies: [
          {
            purpose: W3CMotivationEnum.Tagging,
            value: valueValue,
            id: idValue,
            annotation: annotationId,
          },
          {
            purpose: W3CMotivationEnum.Classifying,
            value: type,
            id: idType,
            annotation: annotationId,
          },
        ],
      };
      annotations.push(a);
    } catch (error) {
      console.warn('Error while extracting information from target', error);
      continue;
    }
  }
  return annotations;
}

function extractAnnotationIdFromBody(bodyId: string): string {
  const array = bodyId.split('/');
  if (array.length > 2) {
    return array[array.length - 2];
  }
  throw new Error('Invalid body id');
}

function getBodyIdAndValueForMotivation(
  bodies: { id: string; motivation: AnyMotivation; body: EmbeddedResource }[],
  motivation: W3CMotivationEnum,
): { id: string; value: string | undefined } {
  const body = bodies.find((b) => b.motivation === motivation);
  if (body === undefined || body.id === undefined) {
    throw new Error('Unknown type of body');
  }
  return { id: body.id, value: body.body.value };
}

function extractInformationFromTarget(url: string) {
  const [baseUrl, fragment] = url.split('#');
  let xywh = null;

  if (fragment && fragment.startsWith('xywh=')) {
    const [x, y, w, h] = fragment.replace('xywh=', '').split(',').map(Number); //map(Number) to convert to numbers

    xywh = { x, y, w, h };
  }
  //TODO: que faire si pas xywh ?

  if (xywh === null) {
    throw new Error('No coordinates found in the target');
  }

  return {
    baseUrl,
    xywh,
  };
}
