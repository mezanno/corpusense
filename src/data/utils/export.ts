import { AnnotationPage, Canvas, Manifest } from '@iiif/presentation-3';
import i18next from 'i18next';
import { getAnnotationText } from '../models/Annotation';
import { convertW3CAnnotationsToIIIF, IIIF_CONTEXT } from '../models/converters/iiif';
import {
  getAnnotationRepository,
  getCanvasRepository,
  getCollectionRepository,
  getTagRepository,
} from '../repositories/indexeddb/dbFactory';

export interface ManifestExport {
  name: string;
  manifest: Manifest;
}

const generateManifestFromCollection = async (id: string): Promise<ManifestExport> => {
  try {
    const collection = await getCollectionRepository().getCollectionById(id);

    if (collection.content.length === 0) {
      throw new Error(i18next.t('error_export_collection_empty', { name: collection.name }));
    }

    const manifestId = 'https://1.rp.mezanno.xyz/toto.json'; //TODO: to be changed
    const items: Canvas[] = [];
    for (let i = 0; i < collection.content.length; i++) {
      const canvasId = collection.content[i].canvasId;
      const canvas = await generateCanvas(canvasId, manifestId, id);
      items.push(canvas);
    }

    const tags = await getTagRepository().getTagsByIds(collection.tags);

    return {
      name: collection.name,
      manifest: {
        '@context': IIIF_CONTEXT,
        // id: list.id as string,
        id: manifestId,
        type: 'Manifest',
        label: {
          none: [collection.name],
        },
        items,
        ...(tags.length > 0 && { tags }),
      },
    };
  } catch (error) {
    //TODO: revoir le type d'erreur
    console.log('error', error);
    throw new Error(i18next.t('error_export_collection_not_found'));
  }
};

const generateCanvas = async (
  canvasId: string,
  manifestId: string,
  collectionId: string,
): Promise<Canvas> => {
  try {
    const canvas = await getCanvasRepository().getCanvasById(canvasId);

    let allAnnotationPages: AnnotationPage[] = [];
    //TODO: il faudra ajouter les annotations déjà existantes
    // if (canvas.annotations !== undefined && canvas.annotations.length > 0) {
    //   allAnnotationPages = allAnnotationPages.concat(canvas.annotations);
    // }

    const canvasAnnotationPage = await generateAnnotationPage(canvasId, collectionId);
    if (canvasAnnotationPage !== undefined) {
      allAnnotationPages = allAnnotationPages.concat(canvasAnnotationPage);
    }

    const canvasIif: Canvas = {
      ...canvas,
      partOf: [{ id: manifestId, type: 'Manifest' }],
    };

    if (allAnnotationPages.length > 0) {
      canvasIif.annotations = allAnnotationPages;
    }

    return canvasIif;
  } catch (error) {
    console.error('Error generating annotation page:', error);
    throw error;
  }
};

const generateAnnotationPage = async (canvasId: string, collectionId: string) => {
  const result = await getAnnotationRepository().getAnnotationsForCanvas(canvasId, collectionId);
  if (result === undefined || result.length === 0) {
    throw new Error(`No annotations found in canvas ${canvasId}`);
  }

  return convertW3CAnnotationsToIIIF(result);
};

const generateTextFromCanvas = async (canvasId: string, collectionId: string) => {
  const annotations = await getAnnotationRepository().getAnnotationsForCanvas(
    canvasId,
    collectionId,
  );
  if (annotations === undefined || annotations.length === 0) {
    console.log(`No annotations found in canvas ${canvasId}`);
    return '';
  }
  let text = '';
  for (let i = 0; i < annotations.length; i++) {
    const t = getAnnotationText(annotations[i]);
    if (t !== undefined && t.length > 0) {
      text = text.concat(t).concat('\n');
    }
  }
  return text;
};

const generateTextForCollection = async (collectionId: string) => {
  const canvases = await getCollectionRepository().getCanvasesByCollectionId(collectionId);
  if (canvases === undefined || canvases.length === 0) {
    throw new Error(i18next.t('error_export_collection_empty'));
  }

  let allTheText = '';
  for (let i = 0; i < canvases.length; i++) {
    const text = await generateTextFromCanvas(canvases[i].id, collectionId);
    if (text !== undefined && text.length > 0) {
      allTheText = allTheText.concat(text);
    }
  }

  return allTheText;
};

export {
  generateAnnotationPage,
  generateCanvas,
  generateManifestFromCollection,
  generateTextForCollection,
  generateTextFromCanvas,
};
