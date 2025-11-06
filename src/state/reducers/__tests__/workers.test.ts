import { isSameScope } from '@/data/models/Scope';
import reducer, { processSuccess, workerInitialState } from '../workers';

describe('workers reducer', () => {
  it('should handle processSuccess', () => {
    const scope = { collectionId: 'collectionId' };
    const action = processSuccess(scope);
    const state = reducer(workerInitialState, action);

    expect(state.status.find((s) => isSameScope(s.scope, scope))).toBeUndefined();
  });
});
