import { ImageData, PdfWorkerMessage } from '@/workers/pdfWorker';
import { useEffect, useRef } from 'react';

const usePdfWorker = () => {
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    const worker = new Worker(new URL('../workers/pdfWorker.ts', import.meta.url), {
      type: 'module',
    });
    workerRef.current = worker;

    return () => worker.terminate();
  }, []);

  const processPdf = async (
    pdfBlob: Blob,
    onProgress?: (progress: { current: number; total: number; percent: number }) => void,
  ) => {
    if (!workerRef.current) {
      throw new Error('Worker not initialized');
    }

    const arrayBuffer = await pdfBlob.arrayBuffer();

    return new Promise<ImageData[]>((resolve, reject) => {
      workerRef.current!.onmessage = (e: MessageEvent<PdfWorkerMessage>) => {
        const { type } = e.data;
        if (type === 'progress') {
          onProgress?.(e.data);
        } else if (type === 'done') {
          resolve(e.data.images);
        }
      };

      workerRef.current!.onerror = reject;

      workerRef.current?.postMessage({ fileArrayBuffer: arrayBuffer });
    });
  };

  return { processPdf };
};

export default usePdfWorker;
