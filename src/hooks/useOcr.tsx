import { Annotation } from '@/data/models/Annotation';
import { useCallback, useState } from 'react';
import { createWorker } from 'tesseract.js';
import { v4 as uuid } from 'uuid';

export const useOcr = () => {
  const [working, setWorking] = useState(false);
  const [progress, setProgress] = useState(0);

  const computeAnnotationsWithOcr = useCallback(
    async (
      canvas: HTMLCanvasElement,
      region?: { left: number; top: number; width: number; height: number },
    ) => {
      if (canvas === undefined) {
        setWorking(false);
        return;
      }

      setWorking(true);
      const worker = await createWorker('fra', 1, {
        logger: (m) => {
          setProgress(m.progress * 100);
        },
      });

      let ocr_annotations: Annotation[] = [];

      try {
        const { data } = await worker.recognize(
          canvas.items[0].items[0].body.id,
          { rectangle: region },
          {
            blocks: true,
            box: true,
            tsv: true,
            text: true,
          },
        );

        console.log(data);
        if (data?.blocks && data.blocks.length > 0) {
          const paragraphs = data.blocks[0].paragraphs;
          ocr_annotations = paragraphs.map((paragraph) => {
            return {
              id: uuid(),
              target: {
                selector: {
                  type: 'RECTANGLE',
                  geometry: {
                    bounds: {
                      minX: paragraph.bbox.x0,
                      minY: paragraph.bbox.y0,
                      maxX: paragraph.bbox.x1,
                      maxY: paragraph.bbox.y1,
                    },
                    x: paragraph.bbox.x0,
                    y: paragraph.bbox.y0,
                    w: paragraph.bbox.x1 - paragraph.bbox.x0,
                    h: paragraph.bbox.y1 - paragraph.bbox.y0,
                  },
                },
              },
              bodies: [
                {
                  purpose: 'classifying',
                  value: 'LINE',
                },
                {
                  purpose: 'tagging',
                  value: paragraph.text,
                },
              ],
              canvasId: canvas.id,
            };
          });
          console.log('ocr_annotations', ocr_annotations);

          // if (ocr_annotations.length > 0) {
          //   annoRef.current?.setAnnotations(ocr_annotations);
          // }
        }
        await worker.terminate();
      } catch (error) {
        console.error(error);
      }

      setWorking(false);
      return ocr_annotations;
    },
    [],
  );

  const computeTextWithOcr = useCallback(
    async (
      canvas: HTMLCanvasElement,
      region?: { left: number; top: number; width: number; height: number },
    ) => {
      if (canvas === undefined) {
        setWorking(false);
        return;
      }

      setWorking(true);
      const worker = await createWorker('fra', 1, {
        logger: (m) => {
          setProgress(m.progress * 100);
        },
      });

      let result = '';

      try {
        const { data } = await worker.recognize(
          canvas.items[0].items[0].body.id,
          { rectangle: region },
          {
            text: true,
          },
        );

        result = data.text;
        await worker.terminate();
      } catch (error) {
        console.error(error);
      }

      setWorking(false);
      return result;
    },
    [],
  );

  return { computeAnnotationsWithOcr, computeTextWithOcr, working, progress };
};
