import { Annotation } from '@/data/models/Annotation';
import {
  generateManifestFromCollection,
  generateTextForAnnotation,
  generateTextForCollection,
  generateTextFromCanvas,
  ManifestExport,
} from '@/data/utils/export';
import i18n from '@/i18n';
import { getErrorMessage } from '@/utils/utils';
import { PayloadAction } from '@reduxjs/toolkit';
import FileSaver from 'file-saver';
import JSZIP from 'jszip';
import { call, CallEffect, Effect, put, takeEvery } from 'redux-saga/effects';
import { pushInfo } from '../reducers/events';
import {
  exportCollectionsRequest,
  exportTextOfAnnotationRequest,
  exportTextOfCanvasRequest,
  exportTextOfCollectionRequest,
} from '../reducers/export';

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

/**
 * Export all the text from all the annotations of a collection
 * @param action
 */
function* handleExportTextOfCanvas(
  action: PayloadAction<{ canvasId: string; collectionId: string }>,
): Generator<Effect, void, string> {
  const { canvasId, collectionId } = action.payload;
  try {
    const text = yield call(generateTextFromCanvas, canvasId, collectionId);
    console.log('Text generated:', text);
    if (text === undefined || text.length === 0) {
      console.log('No text found for this canvas');
      yield put(pushInfo(i18n.t('error_export_no_text')));
      return;
    }
    yield call(
      FileSaver.saveAs,
      new Blob([text], { type: 'text/plain;charset=utf-8' }),
      'exported_text.txt',
    );
  } catch (error) {
    console.error('Error generating text:', getErrorMessage(error));
  }
}

function* handleExportTextOfAnnotation(
  action: PayloadAction<Annotation>,
): Generator<Effect, void, string> {
  //payload = annotationId
  try {
    const text = yield call(generateTextForAnnotation, action.payload);
    console.log('Text generated:', text);
    if (text === undefined || text.length === 0) {
      console.log('No text found for this canvas');
      yield put(pushInfo(i18n.t('error_export_no_text')));
      return;
    }
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
  yield takeEvery(exportCollectionsRequest, handleExportMultipleCollectionsRequest);
  yield takeEvery(exportTextOfCollectionRequest, handleExportTextOfCollection);
  yield takeEvery(exportTextOfCanvasRequest, handleExportTextOfCanvas);
  yield takeEvery(exportTextOfAnnotationRequest, handleExportTextOfAnnotation);
}
