import { Collection } from '@/data/models/Collection';
import { ItemMetadata } from '@/data/models/Metadata';
import { Tag } from '@/data/models/Tag';
import {
  getCanvasRepository,
  getCollectionRepository,
  getItemMetadataRepository,
  getTagRepository,
} from '@/data/repositories/indexeddb/dbFactory';
import { getImage } from '@/data/utils/canvas';
import {
  generateManifestFromCollection,
  generateTextForCollection,
  ManifestExport,
} from '@/data/utils/export';
import { getErrorMessage } from '@/utils/utils';
import { Canvas } from '@iiif/presentation-3';
import { PayloadAction } from '@reduxjs/toolkit';
import FileSaver from 'file-saver';
import JSZIP from 'jszip';
import { call, CallEffect, Effect, put, takeEvery, takeLatest } from 'redux-saga/effects';
import {
  exportMultipleCollectionsRequest,
  exportRequest,
  exportSuccess,
  exportTextOfCollectionRequest,
} from '../reducers/export';

function* handleExportRequest(
  action: PayloadAction<string>,
): Generator<Effect, void, Collection | Canvas | Tag[] | ItemMetadata[]> {
  const collectionId = action.payload;
  const collectionRepository = getCollectionRepository();
  const result = yield call(
    [collectionRepository, collectionRepository.getCollectionById],
    collectionId,
  );
  const collectionToExport = result as Collection;
  console.log('Collection to export', collectionToExport);

  let exportLines = '';
  let header = 'nom_collection\turl\tnum_page\ttags';

  let firstTimeHeader = true;
  const canvasRepository = getCanvasRepository();
  const tagRepository = getTagRepository();
  const itemMetadataRepository = getItemMetadataRepository();
  if (collectionToExport !== undefined) {
    for (let i = 0; i < collectionToExport.content.length; i++) {
      let csvLine = collectionToExport.name;
      const collectionElement = collectionToExport.content[i];
      try {
        const canvas = (yield call(
          [canvasRepository, canvasRepository.getCanvasById],
          collectionElement.canvasId,
        )) as Canvas;

        const image = getImage(canvas);
        const url = image.id;

        if (url !== undefined) {
          csvLine = csvLine.concat('\t').concat(url);

          const label = canvas.label?.none?.[0] ?? '';
          csvLine = csvLine.concat('\t').concat(label);

          if (collectionToExport.tags?.length > 0) {
            const tags = (yield call(
              [tagRepository, tagRepository.getTagsByIds],
              collectionToExport.tags,
            )) as Tag[];
            const tagLabels = tags.reduce((acc, tag) => acc.concat(tag.label).concat(','), '');
            csvLine = csvLine.concat('\t').concat(tagLabels);
          }

          const match = collectionElement.canvasId.match(/ark:\/\d+\/([^\\/]+)/);
          const manifestArk = match ? match[1] : null;
          if (manifestArk !== null) {
            const metadata = (yield call(
              [itemMetadataRepository, itemMetadataRepository.getByArk],
              manifestArk,
            )) as ItemMetadata[];
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
      } catch (error) {
        console.error('Error generating export line:', getErrorMessage(error));
        continue;
      }
    }

    yield put(exportSuccess(header.concat('\n').concat(exportLines)));
  }
}

/**
 * Export one or more collections to a zip file
 * @param action The ids of the collections to export
 */
function* handleExportMultipleCollectionsRequest(
  action: PayloadAction<string[]>,
): Generator<CallEffect, void, ManifestExport | Blob> {
  const collectionIds = action.payload;
  const zip = new JSZIP();
  for (let i = 0; i < collectionIds.length; i++) {
    const id = collectionIds[i];
    try {
      const { name, manifest } = (yield call(generateManifestFromCollection, id)) as ManifestExport;
      console.log(name, ' --> ', manifest);
      zip.file(name + '.json', JSON.stringify(manifest, null, 2));
    } catch (error) {
      console.error('Error generating manifest:', getErrorMessage(error));
      continue;
    }
  }
  const zipContent = (yield call(() => zip.generateAsync({ type: 'blob' }))) as Blob;
  yield call(FileSaver.saveAs, zipContent, 'exported_collections.zip');

  //TODO : il faudrait ajouter un message de succès (avec potentiellement certaines erreurs) ou un message d'erreur
  //exportSuccess
  //exportSuccessWithErrors
  //exportError
}

/**
 * Export all the text from all the annotations of a collection
 * @param action
 */
function* handleExportTextOfCollection(
  action: PayloadAction<string>,
): Generator<Effect, void, string> {
  try {
    const text = yield call(generateTextForCollection, action.payload);
    console.log('Text generated:', text);
    yield call(
      FileSaver.saveAs,
      new Blob([text], { type: 'text/plain;charset=utf-8' }),
      'exported_text.txt',
    );
  } catch (error) {
    console.error('Error generating text:', getErrorMessage(error));
  }
}

export default function* exportSaga() {
  yield takeLatest(exportRequest, handleExportRequest);
  yield takeEvery(exportMultipleCollectionsRequest, handleExportMultipleCollectionsRequest);
  yield takeEvery(exportTextOfCollectionRequest, handleExportTextOfCollection);
}
