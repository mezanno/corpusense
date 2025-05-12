import { SelectedCanvas } from '@/data/models/SelectedCanvas';
import { Canvas } from '@iiif/presentation-3';
import reducer, {
  setSelection,
  setSelectionEndRequest,
  setSelectionStartRequest,
} from '../selection';

describe('selection reducer', () => {
  const initialState = {
    canvases: [],
    indexStart: -1,
    indexEnd: -1,
  };

  it('should handle setSelection', () => {
    const selection: SelectedCanvas[] = [
      { index: 0, canvas: { id: 'canvas1' } as Canvas },
      { index: 1, canvas: { id: 'canvas2' } as Canvas },
    ];
    const action = setSelection({ selection, start: 0, end: 1 });
    const state = reducer(initialState, action);

    expect(state.canvases).toEqual(selection);
    expect(state.indexStart).toBe(0);
    expect(state.indexEnd).toBe(1);
  });

  it('should handle setSelectionStartRequest without modifying state', () => {
    const action = setSelectionStartRequest(0);
    const state = reducer(initialState, action);

    expect(state).toEqual(initialState);
  });

  it('should handle setSelectionEndRequest without modifying state', () => {
    const action = setSelectionEndRequest(1);
    const state = reducer(initialState, action);

    expect(state).toEqual(initialState);
  });
});
