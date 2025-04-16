import { db } from '@/data/db';
import { Annotation } from '@/data/models/Annotation';
import { Collection } from '@/data/models/Collection';
import { convertW3CAnnotationsToIIIF, IIIF_CONTEXT } from '@/data/models/converters/iiif';
import { ItemMetadata } from '@/data/models/Metadata';
import { StoredItem } from '@/data/models/StoredItem';
import { Tag } from '@/data/models/Tag';
import { getCollectionById } from '@/data/services/collections';
import { AnnotationPage, Canvas, IIIFExternalWebResource, Manifest } from '@iiif/presentation-3';
import { PayloadAction } from '@reduxjs/toolkit';
import FileSaver from 'file-saver';
import JSZIP from 'jszip';
import { all, call, Effect, put, select, takeEvery, takeLatest } from 'redux-saga/effects';
import { exportMultipleCollectionsRequest, exportRequest, exportSuccess } from '../reducers/export';
import { getTagsByIds } from '../selectors/tags';

function* handleExportRequest(
  action: PayloadAction<string>,
): Generator<Effect, void, Collection | StoredItem | Tag[] | ItemMetadata[]> {
  const collectionId = action.payload;

  const result = yield call(() => db.collections.get(collectionId));
  const collectionToExport = result as Collection;
  console.log('Collection to export', collectionToExport);

  let exportLines = '';
  let header = 'nom_collection\turl\tnum_page\ttags';

  let firstTimeHeader = true;
  if (collectionToExport !== undefined) {
    for (let i = 0; i < collectionToExport.content.length; i++) {
      let csvLine = collectionToExport.name;
      const collectionElement = collectionToExport.content[i];
      const storedCanvas = (yield call(() => db.storedItems.get(collectionElement.canvasId))) as
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

          if (collectionToExport.tags?.length > 0) {
            const resultTags = yield call(() =>
              db.tags.filter((tag) => collectionToExport.tags.includes(tag.id)).toArray(),
            );
            const tags = resultTags as Tag[];
            const tagLabels = tags.reduce((acc, tag) => acc.concat(tag.label).concat(','), '');
            csvLine = csvLine.concat('\t').concat(tagLabels);
          }

          const match = collectionElement.canvasId.match(/ark:\/\d+\/([^\\/]+)/);
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
): Generator<Effect, void, Manifest | Collection | Blob> {
  const collectionIds = action.payload;
  const zip = new JSZIP();
  for (let i = 0; i < collectionIds.length; i++) {
    const id = collectionIds[i];
    try {
      // const collection = (yield call(getCollectionById, id)) as Collection;
      const result = yield call(getCollectionById, id);
      const collection = result as Collection;

      const manifest = yield call(generateManifestFromCollection, collection);
      console.log('Manifest ', manifest);
      zip.file(collection.name + '.json', JSON.stringify(manifest, null, 2));
    } catch (error) {
      console.error('Error generating manifest:', error);
      continue;
    }
  }
  const zipContent = (yield call(() => zip.generateAsync({ type: 'blob' }))) as Blob;
  yield call(FileSaver.saveAs, zipContent, 'exported_collections.zip');
}

function* generateManifestFromCollection(
  collection: Collection,
): Generator<Effect, unknown, Tag[]> {
  //undefined | Canvas | Tag[]
  if (collection.content === undefined || collection.content.length === 0) {
    throw new Error(`Collection ${collection.name} is empty`);
  }

  const manifestId = 'https://1.rp.mezanno.xyz/toto.json'; //TODO: to be changed
  const items = yield all(
    collection.content.map((item) => call(generateCanvas, item.canvasId, manifestId)),
  );
  const tags = yield select(getTagsByIds, collection.tags);

  return {
    '@context': IIIF_CONTEXT,
    // id: list.id as string,
    id: manifestId,
    type: 'Manifest',
    label: {
      none: [collection.name],
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
  //TODO: il faudra ajouter les annotations déjà existantes
  // if (canvas.annotations !== undefined && canvas.annotations.length > 0) {
  //   allAnnotationPages = allAnnotationPages.concat(canvas.annotations);
  // }

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

  return convertW3CAnnotationsToIIIF(result);
}

export default function* exportSaga() {
  yield takeLatest(exportRequest, handleExportRequest);
  yield takeEvery(exportMultipleCollectionsRequest, handleExportMultipleCollectionsRequest);
}
