import { Canvas } from '@iiif/presentation-3';
import reducer, {
  fetchLayoutRequest,
  processError,
  processRunning,
  processStart,
  processSuccess,
  resetCanvasProcess,
  resetLastWorkerError,
  workerInitialState,
  WorkerStatus,
} from '../workers';

describe('workers reducer', () => {
  it('should handle fetchLayoutRequest', () => {
    const canvas: Canvas = { id: 'canvas1', type: 'Canvas' };
    const action = fetchLayoutRequest({ canvas, collectionId: 'collection1', originalWidth: 100 });
    const state = reducer(workerInitialState, action);

    expect(state.global.lastEvent).toContain('info_start_layout');
  });

  it('should handle processStart', () => {
    const action = processStart('canvas1');
    const state = reducer(workerInitialState, action);

    expect(state.workers['canvas1']).toEqual({ status: WorkerStatus.PENDING });
  });

  it('should handle processRunning', () => {
    const action = processRunning('canvas1');
    const state = reducer(workerInitialState, action);

    expect(state.workers['canvas1']).toEqual({
      status: WorkerStatus.PROCESSING,
      result: '',
      error: '',
    });
  });

  it('should handle processSuccess', () => {
    const action = processSuccess({ canvasId: 'canvas1', result: 'Success Result' });
    const state = reducer(workerInitialState, action);

    expect(state.workers['canvas1']).toEqual({
      status: WorkerStatus.SUCCESS,
      result: 'Success Result',
    });
  });

  it('should handle processError', () => {
    const action = processError({ canvasId: 'canvas1', error: 'Error occurred' });
    const state = reducer(workerInitialState, action);

    expect(state.workers['canvas1']).toEqual({
      status: WorkerStatus.ERROR,
      error: 'Error occurred',
    });
    expect(state.global.error).toBe('Error occurred');
  });

  it('should handle resetLastWorkerError', () => {
    const stateWithError = {
      ...workerInitialState,
      global: { error: 'Error occurred', lastEvent: '' },
    };
    const action = resetLastWorkerError();
    const state = reducer(stateWithError, action);

    expect(state.global.error).toBe('');
  });

  it('should handle resetCanvasProcess', () => {
    const stateWithCanvas = {
      ...workerInitialState,
      workers: {
        canvas1: { status: WorkerStatus.PROCESSING, result: 'Result', error: '' },
      },
    };
    const action = resetCanvasProcess('canvas1');
    const state = reducer(stateWithCanvas, action);

    expect(state.workers['canvas1']).toEqual({
      status: WorkerStatus.IDLE,
      result: '',
      error: '',
    });
  });
});
