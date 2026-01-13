type Crop = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type ImageSource = string | File | Blob;

async function loadImageFromUrl(source: ImageSource): Promise<HTMLImageElement> {
  const img = new Image();

  // CORS uniquement utile pour les URLs distantes
  if (typeof source === 'string' && !source.startsWith('data:')) {
    img.crossOrigin = 'anonymous';
  }

  const src = typeof source === 'string' ? source : URL.createObjectURL(source);
  img.src = src;
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('Failed to load image'));
  });

  // Nettoyage si ObjectURL
  if (source instanceof Blob) {
    URL.revokeObjectURL(src);
  }

  return img;
}

async function cropImage(source: ImageSource, crop: Crop): Promise<HTMLCanvasElement> {
  const img = await loadImageFromUrl(source);

  const canvas = document.createElement('canvas');
  canvas.width = crop.width;
  canvas.height = crop.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas context not available');
  }

  ctx.drawImage(img, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height);

  return canvas;
}

async function canvasToBase64(
  canvas: HTMLCanvasElement,
  type: 'image/png' | 'image/jpeg' = 'image/png',
  quality?: number,
): Promise<string> {
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else reject(new Error('toBlob failed'));
      },
      type, // ex: 'image/png' ou 'image/jpeg'
      quality, // ex: 0.8 pour JPEG
    );
  });
  return await blobToBase64(blob);
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export { canvasToBase64, cropImage };
