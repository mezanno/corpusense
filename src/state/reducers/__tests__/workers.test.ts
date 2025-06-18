import { isSameScope, WorkerStatus } from '@/data/models/Worker';
import reducer, {
  processRunning,
  processStart,
  processSuccess,
  workerInitialState,
} from '../workers';

describe('workers reducer', () => {
  it('should handle fetchLayoutRequest', () => {
    // const canvas: Canvas = { id: 'canvas1', type: 'Canvas' };
    // const action = fetchLayoutRequest({ canvas, collectionId: 'collection1', originalWidth: 100 });
    // const state = reducer(workerInitialState, action);
    // expect(state.global.lastEvent).toContain('info_start_layout');
  });

  it('should handle processStart', () => {
    const scope = { collectionId: 'collectionId' };
    const action = processStart(scope);
    const state = reducer(workerInitialState, action);

    expect(state.status.find((s) => isSameScope(s.scope, scope))).toEqual({
      scope,
      status: WorkerStatus.WAITING,
    });
  });

  it('should handle processRunning', () => {
    const scope = { collectionId: 'collectionId' };
    const action = processRunning(scope);
    const state = reducer(workerInitialState, action);
    expect(state.status.find((s) => isSameScope(s.scope, scope))).toEqual({
      scope,
      status: WorkerStatus.INPROGRESS,
    });
  });

  it('should handle processSuccess', () => {
    const scope = { collectionId: 'collectionId' };
    const action = processSuccess(scope);
    const state = reducer(workerInitialState, action);

    expect(state.status.find((s) => isSameScope(s.scope, scope))).toBeUndefined();
  });

  it('should handle processError', () => {
    // const action = processError({ id: 'canvas1', error: 'Error occurred' });
    // const state = reducer(workerInitialState, action);
    // expect(state.global.error).toBe('Error occurred');
  });

  it('should handle resetLastWorkerError', () => {
    // const stateWithError = {
    //   ...workerInitialState,
    //   global: { error: 'Error occurred', lastEvent: '' },
    // };
    // const action = resetLastWorkerError();
    // const state = reducer(stateWithError, action);
    // expect(state.global.error).toBe('');
  });
});
