import { AnnotationPage, Canvas, Manifest } from '@iiif/presentation-3';
import i18next from 'i18next';
import { db } from '../db';
import { getAnnotationText } from '../models/Annotation';
import { convertW3CAnnotationsToIIIF, IIIF_CONTEXT } from '../models/converters/iiif';
import { getAnnotationsForCanvas } from './annotations';
import { getCanvasesByCollectionId } from './collections';
import { getTagsByIds } from './tags';

export interface ManifestExport {
  name: string;
  manifest: Manifest;
}

const generateManifestFromCollection = async (id: string): Promise<ManifestExport> => {
  const collection = await db.collections.get(id);

  if (collection === undefined) {
    throw new Error(i18next.t('error_export_collection_not_found'));
  }

  if (collection.content.length === 0) {
    throw new Error(i18next.t('error_export_collection_empty', { name: collection.name }));
  }

  const manifestId = 'https://1.rp.mezanno.xyz/toto.json'; //TODO: to be changed
  const items = [];
  for (let i = 0; i < collection.content.length; i++) {
    const canvasId = collection.content[i].canvasId;
    const canvas = await generateCanvas(canvasId, manifestId, id);
    items.push(canvas);
  }

  const tags = await getTagsByIds(collection.tags);

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
};

const generateCanvas = async (canvasId: string, manifestId: string, collectionId: string) => {
  const storedItem = await db.storedItems.get(canvasId);
  if (storedItem === undefined) {
    throw new Error(`Canvas with id ${canvasId} not found`);
  }
  const canvas = storedItem.content as Canvas;
  let allAnnotationPages: AnnotationPage[] = [];
  //TODO: il faudra ajouter les annotations déjà existantes
  // if (canvas.annotations !== undefined && canvas.annotations.length > 0) {
  //   allAnnotationPages = allAnnotationPages.concat(canvas.annotations);
  // }

  try {
    const canvasAnnotationPage = await generateAnnotationPage(canvasId, collectionId);
    if (canvasAnnotationPage !== undefined) {
      allAnnotationPages = allAnnotationPages.concat(canvasAnnotationPage);
    }
  } catch (error) {
    console.error('Error generating annotation page:', error);
  }

  const canvasIif: Canvas = {
    ...canvas,
    partOf: [{ id: manifestId, type: 'Manifest' }],
  };

  if (allAnnotationPages.length > 0) {
    canvasIif.annotations = allAnnotationPages;
  }

  return canvasIif;
};

const generateAnnotationPage = async (canvasId: string, collectionId: string) => {
  const result = await getAnnotationsForCanvas(canvasId, collectionId);
  if (result === undefined || result.length === 0) {
    throw new Error(`No annotations found in canvas ${canvasId}`);
  }

  return convertW3CAnnotationsToIIIF(result);
};

const generateTextFromCanvas = async (canvasId: string, collectionId: string) => {
  const annotations = await getAnnotationsForCanvas(canvasId, collectionId);
  if (annotations === undefined || annotations.length === 0) {
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
  const canvases = await getCanvasesByCollectionId(collectionId);
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
