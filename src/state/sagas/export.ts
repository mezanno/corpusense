import { Annotation } from '@/data/models/Annotation';
import {
  generateTextForAnnotation,
  generateTextForCollection,
  generateTextFromCanvas,
} from '@/data/utils/export';
import i18n from '@/i18n';
import { getErrorMessage } from '@/utils/utils';
import { PayloadAction } from '@reduxjs/toolkit';
import FileSaver from 'file-saver';
import { call, Effect, put, takeEvery } from 'redux-saga/effects';
import { pushInfo } from '../reducers/events';
import {
  exportTextOfAnnotationRequest,
  exportTextOfCanvasRequest,
  exportTextOfCollectionRequest,
} from '../reducers/export';

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
  yield takeEvery(exportTextOfCollectionRequest, handleExportTextOfCollection);
  yield takeEvery(exportTextOfCanvasRequest, handleExportTextOfCanvas);
  yield takeEvery(exportTextOfAnnotationRequest, handleExportTextOfAnnotation);
}
