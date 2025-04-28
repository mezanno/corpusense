import { Annotation, createAnnotation, ElementType } from '../Annotation';

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
  collectionId: string,
  order: number,
): Annotation {
  return createAnnotation({
    canvasId,
    collectionId,
    order,
    minX: Math.min(...line.polygon.map((point) => point[0])),
    minY: Math.min(...line.polygon.map((point) => point[1])),
    maxX: Math.max(...line.polygon.map((point) => point[0])),
    maxY: Math.max(...line.polygon.map((point) => point[1])),
    type: ElementType.LINE,
    value: line.transcription,
  });
}

export function convertPeroTranscriptionsToAnnotations(
  peroResult: PeroResult,
  canvasId: string,
  collectionId: string,
): Annotation[] {
  const annotations: Annotation[] = [];
  for (let i = 0; i < peroResult[0].result.transcriptions.length; i++) {
    const lines = peroResult[0].result.transcriptions[i].lines;
    for (let l = 0; l < lines.length; l++) {
      const line = lines[l];
      annotations.push(convertPeroLineToAnnotation(line, canvasId, collectionId, l));
    }
  }

  return annotations;
}
