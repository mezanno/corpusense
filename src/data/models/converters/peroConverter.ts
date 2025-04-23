import { ShapeType } from '@annotorious/annotorious';
import { v4 as uuid } from 'uuid';
import { Annotation, ElementType, W3CMotivationEnum } from '../Annotation';

const URL_CLASSIFYING = '/class';
const URL_TAGGING = '/tag';

type PeroLine = {
  id: string;
  polygon: [number, number][];
  transcription: string;
  transcription_confidence: number;
};
type PeroResult = [
  {
    result: {
      ocr_engine: {
        name: string;
        code_version: string;
        model_version: string;
      };
      transcriptions: [
        {
          lines: PeroLine[];
          region: [number, number, number, number];
        },
      ];
    };
  },
];

export function convertPeroLineToAnnotation(
  line: PeroLine,
  canvasId: string,
  order: number,
): Annotation {
  const annotationId = uuid();
  const minX = Math.min(...line.polygon.map((point) => point[0]));
  const minY = Math.min(...line.polygon.map((point) => point[1]));
  const maxX = Math.max(...line.polygon.map((point) => point[0]));
  const maxY = Math.max(...line.polygon.map((point) => point[1]));
  return {
    id: annotationId,
    canvasId,
    order,
    target: {
      annotation: annotationId,
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
          w: maxX - minX,
          h: maxY - minY,
        },
      },
    },
    bodies: [
      {
        purpose: W3CMotivationEnum.Classifying,
        value: ElementType.LINE,
        annotation: annotationId,
        id: annotationId + URL_CLASSIFYING,
      },
      {
        purpose: W3CMotivationEnum.Tagging,
        value: line.transcription,
        annotation: annotationId,
        id: annotationId + URL_TAGGING,
      },
    ],
  } as Annotation;
}

export function convertPeroTranscriptionsToAnnotations(
  peroResult: PeroResult,
  canvasId: string,
): Annotation[] {
  const annotations: Annotation[] = [];
  for (let i = 0; i < peroResult[0].result.transcriptions.length; i++) {
    const lines = peroResult[0].result.transcriptions[i].lines;
    for (let l = 0; l < lines.length; l++) {
      const line = lines[l];
      annotations.push(convertPeroLineToAnnotation(line, canvasId, l));
    }
  }

  return annotations;
}
