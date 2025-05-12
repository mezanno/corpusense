import {
  setSelection,
  setSelectionEndRequest,
  setSelectionStartRequest,
} from '@/state/reducers/selection';
import { getCanvases } from '@/state/selectors/manifests';
import { getSelectionEnd, getSelectionStart } from '@/state/selectors/selection';
import { Canvas } from '@iiif/presentation-3';
import { expectSaga } from 'redux-saga-test-plan';
import { select } from 'redux-saga/effects';
import { vi } from 'vitest';
import { handleSetSelectionEnd, handleSetSelectionStart } from '../selection';

describe('saga: selection', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('handleSetSelectionStart', () => {
    it('should select single canvas if selectionEnd is -1', () => {
      const mockCanvases: Canvas[] = [{ id: '1' } as Canvas, { id: '2' } as Canvas];

      const action = {
        type: setSelectionStartRequest.type,
        payload: 1,
      };

      return expectSaga(handleSetSelectionStart, action)
        .provide([
          [select(getCanvases), mockCanvases],
          [select(getSelectionEnd), -1],
        ])
        .put(
          setSelection({
            selection: [{ index: 1, canvas: mockCanvases[1] }],
            start: 1,
            end: 1,
          }),
        )
        .run();
    });

    it('should select single canvas if new start index is > selectionEnd', () => {
      const mockCanvases: Canvas[] = [
        { id: '1' } as Canvas,
        { id: '2' } as Canvas,
        { id: '3' } as Canvas,
      ];
      const indexStart = 2;
      const action = {
        type: setSelectionStartRequest.type,
        payload: indexStart,
      };

      return expectSaga(handleSetSelectionStart, action)
        .provide([
          [select(getCanvases), mockCanvases],
          [select(getSelectionEnd), 1],
        ])
        .put(
          setSelection({
            selection: [{ index: indexStart, canvas: mockCanvases[indexStart] }],
            start: indexStart,
            end: indexStart,
          }),
        )
        .run();
    });

    it('should select all the canvases included between start and selectionEnd', () => {
      const mockCanvases: Canvas[] = [
        { id: '1' } as Canvas,
        { id: '2' } as Canvas,
        { id: '3' } as Canvas,
      ];
      const action = {
        type: setSelectionStartRequest.type,
        payload: 1,
      };

      return expectSaga(handleSetSelectionStart, action)
        .provide([
          [select(getCanvases), mockCanvases],
          [select(getSelectionEnd), 2],
        ])
        .put(
          setSelection({
            selection: [
              { index: 1, canvas: mockCanvases[1] },
              { index: 2, canvas: mockCanvases[2] },
            ],
            start: 1,
            end: 2,
          }),
        )
        .run();
    });
  });
  describe('handleSetSelectionEnd', () => {
    it('should select single canvas if selectionStart is -1', () => {
      const mockCanvases: Canvas[] = [{ id: '1' } as Canvas, { id: '2' } as Canvas];

      const action = {
        type: setSelectionEndRequest.type,
        payload: 1,
      };

      return expectSaga(handleSetSelectionEnd, action)
        .provide([
          [select(getCanvases), mockCanvases],
          [select(getSelectionStart), -1],
        ])
        .put(
          setSelection({
            selection: [{ index: 1, canvas: mockCanvases[1] }],
            start: 1,
            end: 1,
          }),
        )
        .run();
    });

    it('should select single canvas if new end index is < selectionStart', () => {
      const mockCanvases: Canvas[] = [
        { id: '1' } as Canvas,
        { id: '2' } as Canvas,
        { id: '3' } as Canvas,
      ];
      const action = {
        type: setSelectionEndRequest.type,
        payload: 1,
      };

      return expectSaga(handleSetSelectionEnd, action)
        .provide([
          [select(getCanvases), mockCanvases],
          [select(getSelectionStart), 2],
        ])
        .put(
          setSelection({
            selection: [{ index: 1, canvas: mockCanvases[1] }],
            start: 1,
            end: 1,
          }),
        )
        .run();
    });

    it('should select all the canvases included between end and selectionStart', () => {
      const mockCanvases: Canvas[] = [
        { id: '1' } as Canvas,
        { id: '2' } as Canvas,
        { id: '3' } as Canvas,
      ];
      const action = {
        type: setSelectionEndRequest.type,
        payload: 2,
      };

      return expectSaga(handleSetSelectionEnd, action)
        .provide([
          [select(getCanvases), mockCanvases],
          [select(getSelectionStart), 1],
        ])
        .put(
          setSelection({
            selection: [
              { index: 1, canvas: mockCanvases[1] },
              { index: 2, canvas: mockCanvases[2] },
            ],
            start: 1,
            end: 2,
          }),
        )
        .run();
    });
  });
});
