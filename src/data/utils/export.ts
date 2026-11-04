import { BaseError } from '@/utils/BaseError';
import { FunctionResult } from '@/utils/functionResult';
import { AnnotationPage, Canvas, Manifest } from '@iiif/presentation-3';
import { ElementType } from '../models/annotations/annotation';
import { getAnnotationText } from '../models/annotations/annotation.utils';
import { IIIF_CONTEXT } from '../models/converters/iiif';
import { EntityNotFoundError } from '../repositories/EntityNotFoundError';
import {
  getAnnotationRepository,
  getCollectionRepository,
  getResultRepository,
  getTagRepository,
} from '../repositories/indexeddb/dbFactory';
import { EmptyCollectionError } from './errors';
import { convertResultToIIIFAnnotation } from './result';

interface ManifestExport {
  name: string;
  manifest: Manifest;
}

const generateManifestFromCollection = async (
  collectionId: string,
): Promise<FunctionResult<ManifestExport, BaseError>> => {
  const result = await getCollectionRepository().getById(collectionId);
  if (!result.ok) {
    return FunctionResult.err(result.error);
  }

  const collection = result.value;

  if (collection.content.length === 0) {
    return FunctionResult.err(
      new EmptyCollectionError({ id: collection.id, name: collection.name }),
    );
  }

  const manifestId = 'https://1.rp.mezanno.xyz/toto.json'; //TODO: to be changed
  const items: Canvas[] = [];
  for (let i = 0; i < collection.content.length; i++) {
    const canvasId = collection.content[i].canvasId;
    const canvas = await generateCanvas(canvasId, manifestId, collectionId);
    if (canvas.ok) {
      items.push(canvas.value);
    }
    //TODO: on fait quoi en cas d'erreur : il faut l'afficher quelque part
  }

  const tags = await getTagRepository().getByIds(collection.tags);

  return FunctionResult.ok({
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
  });
};

const generateCanvas = async (
  canvasId: string,
  manifestId: string,
  collectionId: string,
): Promise<FunctionResult<Canvas, BaseError>> => {
  const result = await getCollectionRepository().getCanvasByScope({
    canvasId,
    collectionId,
  });
  if (!result.ok) {
    return FunctionResult.err(new EntityNotFoundError({ entity: 'Canvas', id: canvasId }));
  }
  const canvasWithSourceId = result.value;

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
    console.error(`${collectionId} : Skipping annotation page for canvas ${canvasId}: `, error);
  }

  const canvasIif: Canvas = {
    ...canvasWithSourceId.canvas,
    partOf: [{ id: manifestId, type: 'Manifest' }],
  };

  if (allAnnotationPages.length > 0) {
    canvasIif.annotations = allAnnotationPages;
  }

  return FunctionResult.ok(canvasIif);
};

const generateAnnotationPage = async (canvasId: string, collectionId: string) => {
  let result = await getResultRepository().getByScopeAndWorkerName(
    {
      collectionId,
      canvasId,
    },
    'openai',
  );
  if (!result.ok) {
    result = await getResultRepository().getByScopeAndWorkerName(
      {
        collectionId,
        canvasId,
      },
      'mistral',
    );
  }

  const lineAnnotations = await getAnnotationRepository().getByScopeAndTypes(
    { canvasId, collectionId },
    [ElementType.TEXT_LINE],
  );
  if (!result.ok || lineAnnotations.length === 0) {
    return undefined;
  }

  return await convertResultToIIIFAnnotation(result.value);
};

const generateTextFromCanvas = async (canvasId: string, collectionId: string) => {
  const annotations = await getAnnotationRepository().getByScope({
    canvasId,
    collectionId,
  });
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

export type TextWithAnnotationId = { text: string; annotationId: string }[];

const generateTextWithAnnotationIdFromCanvas = async (canvasId: string, collectionId: string) => {
  const annotations = await getAnnotationRepository().getByScope({
    canvasId,
    collectionId,
  });
  if (annotations === undefined || annotations.length === 0) {
    return [];
  }
  const text: TextWithAnnotationId = [];
  for (let i = 0; i < annotations.length; i++) {
    text.push({ text: getAnnotationText(annotations[i]), annotationId: annotations[i].id });
  }
  return text;
};

const generateNumberedTextFromCanvas = async (
  canvasId: string,
  collectionId: string,
  startTo?: number,
) => {
  const annotations = await getAnnotationRepository().getByScope({
    canvasId,
    collectionId,
  });
  if (annotations === undefined || annotations.length === 0) {
    return { text: '', numLines: 0 };
  }
  let text = '';
  let lineNumber = startTo !== undefined ? startTo : 0;
  for (let i = 0; i < annotations.length; i++) {
    const t = getAnnotationText(annotations[i]);
    if (t !== undefined && t.length > 0) {
      text = text.concat(`{{${lineNumber}}}`).concat(t).concat('\n');
      lineNumber++;
    }
  }
  return { text, numLines: lineNumber };
};

const generateNumberedTextForCollection = async (
  collectionId: string,
): Promise<FunctionResult<string, BaseError>> => {
  const canvasesResult = await getCollectionRepository().getCanvasesByCollectionId(collectionId);

  if (!canvasesResult.ok || canvasesResult.value.length === 0) {
    return FunctionResult.err(new EmptyCollectionError({ id: collectionId, name: 'unknown' }));
  }

  const canvases = canvasesResult.value;
  let allTheText = '';
  let lineCount = 0;
  for (let i = 0; i < canvases.length; i++) {
    const { text, numLines } = await generateNumberedTextFromCanvas(
      canvases[i].id,
      collectionId,
      lineCount,
    );
    lineCount = numLines;
    if (text !== undefined && text.length > 0) {
      allTheText = allTheText.concat(text);
    }
  }

  return FunctionResult.ok(allTheText);
};

const generateTextForCollection = async (
  collectionId: string,
): Promise<FunctionResult<string, BaseError>> => {
  const canvasesResult = await getCollectionRepository().getCanvasesByCollectionId(collectionId);

  if (!canvasesResult.ok || canvasesResult.value.length === 0) {
    return FunctionResult.err(new EmptyCollectionError({ id: collectionId, name: 'unknown' }));
  }

  const canvases = canvasesResult.value;
  let allTheText = '';
  for (let i = 0; i < canvases.length; i++) {
    const text = await generateTextFromCanvas(canvases[i].id, collectionId);
    if (text !== undefined && text.length > 0) {
      allTheText = allTheText.concat(text);
    }
  }

  return FunctionResult.ok(allTheText);
};

export {
  generateManifestFromCollection,
  generateNumberedTextForCollection,
  generateNumberedTextFromCanvas,
  generateTextForCollection,
  generateTextFromCanvas,
  generateTextWithAnnotationIdFromCanvas,
};
