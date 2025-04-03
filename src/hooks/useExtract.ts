import { db } from '@/data/db';
import { Annotation } from '@/data/models/Annotation';

const useExtract = () => {
  return async (annotation: Annotation) => {
    const canvasId = annotation.canvasId;
    const text = annotation.bodies.find((body) => body.purpose === 'tagging')?.value ?? '';

    let manifestId = '***';
    let title = '***';
    try {
      const manifest = await db.storedItems
        .filter((si) => si.content.items.some((item) => item.id === canvasId))
        .toArray();
      console.log('result', manifest);
      manifestId = manifest[0].id;
      if (manifest.length > 0) {
        const metadata = manifest[0].content.metadata;
        for (let i = 0; i < metadata.length; i++) {
          const m = metadata[i];
          if (m.label.none[0] === 'Title') {
            title = m.value.none[0];
            break;
          }
        }
      }
    } catch (error) {
      console.error('Error fetching stored items:', error);
    }

    let page = '***';
    try {
      const canvas = await db.storedItems.filter((si) => si.id === canvasId).toArray();
      if (canvas.length > 0) {
        page = canvas[0].content.label.none[0];
      }
    } catch (error) {
      console.error('Error fetching stored items:', error);
    }
    return `Extrait de '${title}' (${manifestId}) :  ${text} (page ${page} - ${canvasId})`;
  };
};

export { useExtract };
