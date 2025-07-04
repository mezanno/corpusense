import { Canvas } from '@iiif/presentation-3';
import reducer, { reset, setCanvasFromComponent } from '../canvas';

describe('canvas reducer', () => {
  const initialState = {
    values: {},
  };

  it('should handle setCanvasFromComponent', () => {
    const canvas: Canvas = {
      id: 'canvas1',
      type: 'Canvas',
      label: { en: ['Test Canvas'] },
    };
    const action = setCanvasFromComponent({ componentId: 'component1', canvas });
    const state = reducer(initialState, action);

    expect(state.values['component1']).toEqual(canvas);
  });

  it('should handle reset', () => {
    const stateWithValues = {
      values: {
        component1: {
          id: 'canvas1',
          type: 'Canvas',
          label: { en: ['Test Canvas'] },
        },
      },
    };
    const action = reset('component1');
    //@ts-expect-error stateWithValues
    const state = reducer(stateWithValues, action);

    expect(state.values).toEqual({});
  });
});
