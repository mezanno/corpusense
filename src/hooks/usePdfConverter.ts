import * as pdfjsLib from 'pdfjs-dist';
import { useCallback, useState } from 'react';

// Worker setup should ideally be done once at the app level or in a singleton,
// but for the hook it's okay to ensure it's set.
import { getConvertedFileRepository } from '@/data/repositories/indexeddb/dbFactory';
import { generateManifest } from '@/utils/manifest';
import { getErrorMessage } from '@/utils/utils';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import { useTranslation } from 'react-i18next';
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

type ImageData = {
  blob: Blob;
  width: number;
  height: number;
  filename?: string;
};

export function usePdfConverter() {
  const { t } = useTranslation();
  const [fileHandle, setFileHandle] = useState<FileSystemFileHandle | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [status, setStatus] = useState<'idle' | 'processing' | 'done' | 'error'>('idle');
  const [progress, setProgress] = useState<number>(0);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = useCallback((msg: string) => {
    setLogs((prev) => [...prev, `${new Date().toLocaleTimeString()} - ${msg}`]);
  }, []);

  const reset = useCallback(() => {
    setFileHandle(null);
    setFileName('');
    setStatus('idle');
    setProgress(0);
    setLogs([]);
  }, []);

  const selectFile = useCallback(async () => {
    try {
      const [handle] = await window.showOpenFilePicker({
        types: [
          {
            description: t('description_pdf_files'),
            accept: { 'application/pdf': ['.pdf'] },
          },
        ],
        multiple: false,
      });

      const file = await handle.getFile();
      setFileHandle(handle);
      setFileName(file.name);
      setStatus('idle');
      setLogs([]);
      setProgress(0);
      addLog(t('log_selected_file', { fileName: file.name }));
    } catch (err) {
      addLog(t('log_error_selecting_file', { message: getErrorMessage(err) }));
    }
  }, [addLog, t]);

  const renderPageToBlob = async (
    pdfDoc: pdfjsLib.PDFDocumentProxy,
    pageNum: number,
    scale: number = 2.0,
  ): Promise<ImageData | null> => {
    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return null;

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({ canvasContext: context, viewport, canvas }).promise;

    return new Promise((resolve) => {
      // Use JPEG for thumbnail compression if scale is small, otherwise PNG
      const type = scale < 1 ? 'image/jpeg' : 'image/png';
      const quality = scale < 1 ? 0.7 : undefined;
      canvas.toBlob(
        (blob) =>
          resolve(blob === null ? null : { blob, width: canvas.width, height: canvas.height }),
        type,
        quality,
      );
    });
  };

  const convert = useCallback(async () => {
    if (!fileHandle) return;

    try {
      setStatus('processing');
      addLog(t('log_start_conversion'));

      const file = await fileHandle.getFile();
      const arrayBuffer = await file.arrayBuffer();

      const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const numPages = pdfDoc.numPages;
      addLog(t('log_pdf_loaded', { numPages: numPages }));

      addLog(t('log_select_output_folder'));
      const dirHandle = await window.showDirectoryPicker({
        startIn: fileHandle,
      });

      addLog(t('log_output_ok'));

      const baseName = fileName.replace('.pdf', '');
      let firstPageBlob: ImageData | null = null;

      const imagesData: ImageData[] = [];
      for (let i = 1; i <= numPages; i++) {
        const blob = await renderPageToBlob(pdfDoc, i);
        if (!blob) {
          addLog(t('log_error_render', { pageNumber: i }));
          continue;
        }

        if (i === 1) {
          // Create a separate optimized thumbnail (0.3 scale ~ 200-300px width usually)
          const thumbBlob = await renderPageToBlob(pdfDoc, i, 0.3);
          if (thumbBlob) {
            firstPageBlob = thumbBlob;
          } else {
            // Fallback to the high-res one if thumb generation fails
            firstPageBlob = blob;
          }
        }

        const newFileName = `${baseName}_page_${i.toString().padStart(3, '0')}.png`;
        blob.filename = newFileName;
        addLog(t('log_saving', { filename: newFileName }));

        const newFileHandle = await dirHandle.getFileHandle(newFileName, { create: true });
        const writable = await newFileHandle.createWritable();
        await writable.write(blob.blob);
        await writable.close();

        imagesData.push(blob);

        setProgress(Math.round((i / numPages) * 100));
      }

      setStatus('done');
      addLog(t('log_conversion_completed'));

      if (firstPageBlob) {
        //save the thumbnail
        const thumbnail = `${baseName}_thumbnail.png`;
        const newFileHandle = await dirHandle.getFileHandle(thumbnail, { create: true });
        const writable = await newFileHandle.createWritable();
        await writable.write(firstPageBlob.blob);
        await writable.close();

        //generate the manifest
        const manifestName = `${baseName}_manifest.json`;
        const newManifest = generateManifest({
          documentName: manifestName,
          canvasInfo: imagesData.map((img) => ({
            id: `${dirHandle.name}/${img.filename!}`,
            thumb: `${dirHandle.name}/${img.filename!}`,
            width: img.width,
            height: img.height,
          })),
          manifestId: manifestName,
          isFileSystem: true,
          folder: dirHandle.name, // Ajouter le préfixe de nom de fichier comme dossier),
        });
        const manifestFileHandle = await dirHandle.getFileHandle(manifestName, {
          create: true,
        });
        const manifestWritable = await manifestFileHandle.createWritable();
        await manifestWritable.write(JSON.stringify(newManifest, null, 2));
        await manifestWritable.close();

        console.log(newManifest);

        const convertedFileRepository = getConvertedFileRepository();
        await convertedFileRepository.add({
          id: crypto.randomUUID(),
          title: fileName,
          pageCount: numPages,
          thumbnailBlob: firstPageBlob.blob,
          outputDirectoryHandle: dirHandle,
          timestamp: Date.now(),
          manifestName,
        });
      }
    } catch (err) {
      console.error(err);
      setStatus('error');
      addLog(t('log_error', { message: getErrorMessage(err) }));
    }
  }, [fileHandle, fileName, addLog, t]);

  return {
    fileHandle,
    fileName,
    status,
    progress,
    logs,
    selectFile,
    convert,
    reset,
  };
}
