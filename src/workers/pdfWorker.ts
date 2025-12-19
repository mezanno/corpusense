import { PDFiumLibrary, PDFiumPageRenderOptions } from '@hyzyla/pdfium/browser/base64';

const library = await PDFiumLibrary.init();

async function renderFunction(options: PDFiumPageRenderOptions) {
  // On crée un canvas hors-écran
  const canvas = new OffscreenCanvas(options.width, options.height);
  const ctx = canvas.getContext('2d');

  // On place la donnée RGBA dans le canvas
  const imageData = new ImageData(
    new Uint8ClampedArray(options.data),
    options.width,
    options.height,
  );
  if (ctx === null) {
    return new Uint8Array();
  }
  ctx.putImageData(imageData, 0, 0);

  // Conversion en PNG
  const blob = await canvas.convertToBlob({ type: 'image/png' });
  const buffer = new Uint8Array(await blob.arrayBuffer());

  return buffer;
}

export type PdfProgressMessage = {
  type: 'progress';
  current: number;
  total: number;
  percent: number;
};

export type PdfDoneMessage = {
  type: 'done';
  images: ImageData[];
};

export type PdfWorkerMessage = PdfProgressMessage | PdfDoneMessage;

export type ImageData = {
  data: Uint8Array;
  width: number;
  height: number;
  fullImageUrl?: string;
  thumbImageUrl?: string;
};

self.onmessage = async (e) => {
  const { fileArrayBuffer } = e.data as {
    fileArrayBuffer: ArrayBuffer;
  };

  const pdf = await library.loadDocument(new Uint8Array(fileArrayBuffer));
  const totalPages = pdf.getPageCount();

  const images: ImageData[] = [];
  let currentPage = 0;
  for (const page of pdf.pages()) {
    const image = await page.render({
      scale: 3,
      render: renderFunction,
    });
    images.push({
      data: image.data,
      width: image.width,
      height: image.height,
    });

    currentPage++;

    self.postMessage({
      type: 'progress',
      current: currentPage,
      total: totalPages,
      percent: (currentPage / totalPages) * 100,
    });
  }

  self.postMessage({ type: 'done', images });
};
