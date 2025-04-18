import { db } from '@/data/db';
import { Collection } from '@/data/models/Collection';
import { ItemMetadata } from '@/data/models/Metadata';
import { StoredItem } from '@/data/models/StoredItem';
import { Tag } from '@/data/models/Tag';
import { getCollectionById } from '@/data/services/collections';
import { generateManifestFromCollection } from '@/data/services/export';
import { Canvas, IIIFExternalWebResource, Manifest } from '@iiif/presentation-3';
import { PayloadAction } from '@reduxjs/toolkit';
import FileSaver from 'file-saver';
import JSZIP from 'jszip';
import { call, Effect, put, takeEvery, takeLatest } from 'redux-saga/effects';
import { exportMultipleCollectionsRequest, exportRequest, exportSuccess } from '../reducers/export';

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

export default function* exportSaga() {
  yield takeLatest(exportRequest, handleExportRequest);
  yield takeEvery(exportMultipleCollectionsRequest, handleExportMultipleCollectionsRequest);
}
