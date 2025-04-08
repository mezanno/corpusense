import { db } from '@/data/db';
import { Annotation } from '@/data/models/Annotation';
import { List } from '@/data/models/List';
import { ItemMetadata } from '@/data/models/Metadata';
import { StoredItem } from '@/data/models/StoredItem';
import { Tag } from '@/data/models/Tag';
import {
  Annotation as AnnotationIIF,
  AnnotationPage,
  Canvas,
  IIIFExternalWebResource,
  Manifest,
} from '@iiif/presentation-3';
import { PayloadAction } from '@reduxjs/toolkit';
import { all, call, Effect, put, takeEvery, takeLatest } from 'redux-saga/effects';
import { exportMultipleCollectionsRequest, exportRequest, exportSuccess } from '../reducers/export';

function* handleExportRequest(
  action: PayloadAction<string>,
): Generator<Effect, void, List | StoredItem | Tag[] | ItemMetadata[]> {
  const listId = action.payload;

  const result = yield call(() => db.lists.get(listId));
  const listToExport = result as List;
  console.log('List to export', listToExport);

  let exportLines = '';
  let header = 'nom_liste\turl\tnum_page\ttags';

  let firstTimeHeader = true;
  if (listToExport !== undefined && listToExport.content) {
    for (let i = 0; i < listToExport.content.length; i++) {
      let csvLine = listToExport.name;
      const listElement = listToExport.content[i];
      const storedCanvas = (yield call(() => db.storedItems.get(listElement.canvasId))) as
        | StoredItem
        | undefined;

      const canvas = storedCanvas?.content as Canvas;
      if (canvas !== undefined) {
        const image = canvas.items?.[0]?.items?.[0].body as IIIFExternalWebResource;
        const url = image.id;

        if (url !== undefined) {
          csvLine = csvLine.concat('\t').concat(url);

          const label = canvas.label?.none?.[0] ?? '';
          csvLine = csvLine.concat('\t').concat(label);

          if (listToExport.tags?.length > 0) {
            const resultTags = yield call(() =>
              db.tags.filter((tag) => listToExport.tags.includes(tag.id)).toArray(),
            );
            const tags = resultTags as Tag[];
            const tagLabels = tags.reduce((acc, tag) => acc.concat(tag.label).concat(','), '');
            csvLine = csvLine.concat('\t').concat(tagLabels);
          }

          const match = listElement.canvasId.match(/ark:\/\d+\/([^\\/]+)/);
          const manifestArk = match ? match[1] : null;
          if (manifestArk !== null) {
            const resultMetadata = yield call(() =>
              db.itemMetadata.filter((itemMD) => itemMD.id.includes(manifestArk)).toArray(),
            );
            const metadata = resultMetadata as ItemMetadata[];
            for (let j = 0; j < metadata.length; j++) {
              console.log();

              csvLine = csvLine.concat('\t').concat(metadata[j].attribute.value);
              if (firstTimeHeader) {
                header = header.concat('\t').concat(metadata[j].attribute.label);
              }
            }
            firstTimeHeader = false;
          }
          csvLine = csvLine.concat('\n');
          exportLines = exportLines.concat(csvLine);
        }
      }
    }

    yield put(exportSuccess(header.concat('\n').concat(exportLines)));
  }
}

function* handleExportMultipleCollectionsRequest(
  action: PayloadAction<string[]>,
): Generator<Effect, void, Manifest> {
  const listIds = action.payload;
  for (let i = 0; i < listIds.length; i++) {
    const id = listIds[i];
    try {
      const manifest = yield* generateManifest(id);
      console.log('Manifest ', manifest);
    } catch (error) {
      console.error('Error generating manifest:', error);
      continue;
    }
  }
}

const IIIF_CONTEXT = 'http://iiif.io/api/presentation/3/context.json';

function* generateManifest(id: string): Generator<Effect, unknown, unknown> {
  //List | undefined | Canvas | Tag[]
  const result = yield call(() => db.lists.get(id));
  if (result === undefined) {
    throw new Error(`List with id ${id} not found`);
  }
  const list = result as List;

  if (list.content === undefined || list.content.length === 0) {
    throw new Error(`List with id ${id} is empty`);
  }

  const manifestId = 'https://1.rp.mezanno.xyz/toto.json';
  const items = yield all(
    list.content.map((item) => call(generateCanvas, item.canvasId, manifestId)),
  );
  console.log('Items', items);

  let tags: Tag[] = [];
  if (list.tags?.length > 0) {
    const resultTags = yield call(() =>
      db.tags.filter((tag) => list.tags.includes(tag.id)).toArray(),
    );
    tags = resultTags as Tag[];
  }

  return {
    '@context': IIIF_CONTEXT,
    // id: list.id as string,
    id: manifestId,
    type: 'Manifest',
    label: {
      none: [list.name],
    },
    items,
    ...(tags.length > 0 && { tags }),
  };
}

function* generateCanvas(
  canvasId: string,
  manifestId: string,
): Generator<Effect, Canvas, AnnotationPage> {
  const result = yield call(() => db.storedItems.get(canvasId));
  if (result === undefined) {
    throw new Error(`Canvas with id ${canvasId} not found`);
  }
  const storedItem = result as unknown as StoredItem;

  const canvas = storedItem.content as Canvas;

  let allAnnotationPages: AnnotationPage[] = [];
  if (canvas.annotations !== undefined && canvas.annotations.length > 0) {
    allAnnotationPages = allAnnotationPages.concat(canvas.annotations);
  }

  try {
    const canvasAnnotationPage = yield call(generateAnnotationPage, canvasId);
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
}

function* generateAnnotationPage(
  canvasId: string,
): Generator<Effect, AnnotationPage, Annotation[]> {
  const result = yield call(() => db.annotations.where('canvasId').equals(canvasId).toArray());

  if (result === undefined || result.length === 0) {
    throw new Error(`Annotation with id ${canvasId} not found`);
  }

  const annotationPageId = `${canvasId}/annotationpage/corpusense`;
  const annotationsIff: AnnotationIIF[] = [];
  for (let i = 0; i < result.length; i++) {
    const a = result[i];
    const bounds = a.target.selector.geometry.bounds;
    const iifAnnotation = {
      '@context': IIIF_CONTEXT,
      type: 'Annotation',
      id: `${annotationPageId}/${a.id}`,
      motivation: 'commenting',
      target: `${canvasId}#xywh=${bounds.minX},${bounds.minY},${bounds.maxX - bounds.minX},${bounds.maxY - bounds.minY}`,
      body: {
        type: 'TextualBody',
        value: 'toto',
        format: 'text/plain',
      },
    };

    //@ts-expect-error annotationsIff
    annotationsIff.push(iifAnnotation);
  }

  return {
    '@context': IIIF_CONTEXT,
    id: annotationPageId,
    type: 'AnnotationPage',
    items: annotationsIff,
  };
}

export default function* exportSaga() {
  yield takeLatest(exportRequest, handleExportRequest);
  yield takeEvery(exportMultipleCollectionsRequest, handleExportMultipleCollectionsRequest);
}
