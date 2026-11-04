import { useEffect, useState } from 'react';

const SAMPLE_SIZE = 16;

/** Returns true if the image at `url` is globally dark (average perceived luminance < 0.5). */
const useIsDarkImage = (url: string | null | undefined) => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (!url) {
      setIsDark(false);
      return;
    }
    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = SAMPLE_SIZE;
      canvas.height = SAMPLE_SIZE;
      const ctx = canvas.getContext('2d');
      if (!ctx || cancelled) return;
      ctx.drawImage(img, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
      try {
        const { data } = ctx.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
        let sum = 0;
        for (let i = 0; i < data.length; i += 4) {
          sum += 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
        }
        setIsDark(sum / (data.length / 4) / 255 < 0.5);
      } catch {
        // canvas tainted by a cross-origin image: keep the light default
        setIsDark(false);
      }
    };
    img.src = url;
    return () => {
      cancelled = true;
    };
  }, [url]);

  return isDark;
};

export default useIsDarkImage;
