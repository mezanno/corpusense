import { SelectedCanvas } from '@/data/models/SelectedCanvas';
import { Canvas } from '@iiif/presentation-3';
import { PayloadAction } from '@reduxjs/toolkit';
import { Effect, put, select, takeLatest } from 'redux-saga/effects';
import {
  setSelection,
  setSelectionEndRequest,
  setSelectionStartRequest,
} from '../reducers/selection';
import { getCanvases } from '../selectors/manifests';
import { getSelectionEnd, getSelectionStart } from '../selectors/selection';

/**
 * Side effect to set the selection start index. Update the canvases selected accordingly.
 * @param action
 */
function* handleSetSelectionStart(
  action: PayloadAction<number>,
): Generator<Effect, void, Canvas[] | number> {
  const newIndexStart = action.payload;

  const canvasesLoaded = yield select(getCanvases);
  if (Array.isArray(canvasesLoaded) && canvasesLoaded.length > 0) {
    const selectionEnd = yield select(getSelectionEnd);
    const end = selectionEnd as number;

    const selection = [] as SelectedCanvas[];
    let newIndexEnd = newIndexStart;

    //si end = -1, la sélection ne contient que l'élément à index
    if (end === -1) {
      selection.push({ index: newIndexStart, canvas: canvasesLoaded[newIndexStart] });
    } else {
      //si index est plus grand que end, la séléction ne contient que l'élément à index
      if (newIndexStart > end) {
        selection.push({ index: newIndexStart, canvas: canvasesLoaded[newIndexStart] });
      } else {
        for (let i = newIndexStart; i <= end; i++) {
          selection.push({ index: i, canvas: canvasesLoaded[i] });
        }
        newIndexEnd = end;
      }
    }

    yield put(
      setSelection({
        selection,
        start: newIndexStart,
        end: newIndexEnd,
      }),
    );
  }
}

/**
 * Side effect to set the selection end index. Update the canvases selected accordingly.
 * @param action
 */
function* handleSetSelectionEnd(
  action: PayloadAction<number>,
): Generator<Effect, void, Canvas[] | number> {
  const newIndexEnd = action.payload;

  const canvasesLoaded = yield select(getCanvases);
  if (Array.isArray(canvasesLoaded) && canvasesLoaded.length > 0) {
    const currentIndexStart = yield select(getSelectionStart);
    const start = currentIndexStart as number;

    const selection = [] as SelectedCanvas[];
    let newIndexStart = newIndexEnd;

    //si start = -1, la sélection ne contient que l'élément à index
    if (start === -1) {
      selection.push({ index: newIndexEnd, canvas: canvasesLoaded[newIndexEnd] });
    } else {
      //si index est plus petit que start, la séléction ne contient que l'élément à index
      if (newIndexEnd < start) {
        selection.push({ index: newIndexEnd, canvas: canvasesLoaded[newIndexEnd] });
      } else {
        for (let i = start; i <= newIndexEnd; i++) {
          selection.push({ index: i, canvas: canvasesLoaded[i] });
        }
        newIndexStart = start;
      }
    }

    yield put(
      setSelection({
        selection,
        start: newIndexStart,
        end: newIndexEnd,
      }),
    );
  }
}

export default function* viewerSaga() {
  yield takeLatest(setSelectionStartRequest, handleSetSelectionStart);
  yield takeLatest(setSelectionEndRequest, handleSetSelectionEnd);
}

export { handleSetSelectionEnd, handleSetSelectionStart };
