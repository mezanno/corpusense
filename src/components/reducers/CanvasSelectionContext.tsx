import { Canvas } from '@iiif/presentation-3';
import { createContext, Reducer, useContext, useReducer } from 'react';

export const CANVAS_SELECTION_ACTIONS = {
  SET_SELECTION: 'SET_SELECTION',
  SET_SELECTION_START: 'SET_SELECTION_START',
  SET_SELECTION_END: 'SET_SELECTION_END',
} as const;

export type CanvasSelectionAction =
  | {
      type: typeof CANVAS_SELECTION_ACTIONS.SET_SELECTION;
      payload: number[]; //list of selected indexes
    }
  | { type: typeof CANVAS_SELECTION_ACTIONS.SET_SELECTION_START; payload: number }
  | { type: typeof CANVAS_SELECTION_ACTIONS.SET_SELECTION_END; payload: number };

type CanvasSelectionState = {
  loadedCanvases: Canvas[] | [];
  selectedIndexes: number[]; //indexes des canvases sélectionnés
  indexStart: number;
  indexEnd: number;
};

const initState = (loadedCanvases: Canvas[]): CanvasSelectionState => {
  return { loadedCanvases, selectedIndexes: [] as number[], indexStart: -1, indexEnd: -1 };
};

const reducer: Reducer<CanvasSelectionState, CanvasSelectionAction> = (
  state: CanvasSelectionState,
  action: CanvasSelectionAction,
) => {
  switch (action.type) {
    case CANVAS_SELECTION_ACTIONS.SET_SELECTION:
      console.log('CanvasSelectionContext - SET_SELECTION', action.payload);

      return {
        ...state,
        indexStart: Math.min(...action.payload),
        indexEnd: Math.max(...action.payload),
        selectedIndexes: action.payload,
      };
    case CANVAS_SELECTION_ACTIONS.SET_SELECTION_START:
      return { ...state, ...computeSelectedIndexesFromStart(action.payload, state) };
    case CANVAS_SELECTION_ACTIONS.SET_SELECTION_END:
      return { ...state, ...computeSelectedIndexesFromEnd(action.payload, state) };
    default:
      return state;
  }
};

type CanvasSelectionContextType = {
  isSelected: (index: number) => boolean;
  hasSelectedElements: () => boolean;
  getSelectedCanvases: () => Canvas[];
  getSelectionCount: () => number;
  dispatch: React.Dispatch<CanvasSelectionAction>;
};

const CanvasSelectionContext = createContext<CanvasSelectionContextType | undefined>(undefined);

export const CanvasSelectionProvider = ({
  children,
  canvasesLoaded,
}: {
  children: React.ReactNode;
  canvasesLoaded: Canvas[];
}) => {
  const [state, dispatch] = useReducer(reducer, canvasesLoaded, initState);

  const isSelected = (index: number): boolean => {
    return state.selectedIndexes.includes(index);
  };

  const hasSelectedElements = (): boolean => {
    return state.selectedIndexes.length > 0;
  };

  const getSelectionCount = (): number => state.selectedIndexes.length;

  const getSelectedCanvases = (): Canvas[] => {
    //TODO : ça se trouve il y a seulement besoin des id des canvas
    // return state.selectedIndexes.map((index) => state.loadedCanvases[index]).filter(Boolean);
    return state.loadedCanvases.filter((_, index) => state.selectedIndexes.includes(index));
  };

  return (
    <CanvasSelectionContext.Provider
      value={{ isSelected, hasSelectedElements, getSelectedCanvases, getSelectionCount, dispatch }}
    >
      {children}
    </CanvasSelectionContext.Provider>
  );
};

export const useCanvasSelectionContext = () => {
  const context = useContext(CanvasSelectionContext);
  if (!context) {
    throw new Error('useCanvasSelectionContext must be used within a CanvasSelectionProvider');
  }
  return context;
};

function computeSelectedIndexesFromStart(newIndexStart: number, state: CanvasSelectionState) {
  if (state.loadedCanvases.length > 0) {
    const selection = [] as number[];
    let newIndexEnd = newIndexStart;

    //si end = -1, la sélection ne contient que l'élément à index
    if (state.indexEnd === -1) {
      selection.push(newIndexStart);
    } else {
      //si index est plus grand que end, la séléction ne contient que l'élément à index
      if (newIndexStart > state.indexEnd) {
        selection.push(newIndexStart);
      } else {
        for (let i = newIndexStart; i <= state.indexEnd; i++) {
          selection.push(i);
        }
        newIndexEnd = state.indexEnd;
      }
    }

    return {
      selectedIndexes: selection,
      indexStart: newIndexStart,
      indexEnd: newIndexEnd,
    };
  }
}

function computeSelectedIndexesFromEnd(newIndexEnd: number, state: CanvasSelectionState) {
  if (state.loadedCanvases.length > 0) {
    const selection = [] as number[];
    let newIndexStart = newIndexEnd;

    //si start = -1, la sélection ne contient que l'élément à index
    if (state.indexStart === -1) {
      selection.push(newIndexEnd);
    } else {
      //si index est plus petit que start, la séléction ne contient que l'élément à index
      if (newIndexEnd < state.indexStart) {
        selection.push(newIndexEnd);
      } else {
        for (let i = state.indexStart; i <= newIndexEnd; i++) {
          selection.push(i);
        }
        newIndexStart = state.indexStart;
      }
    }

    return {
      selectedIndexes: selection,
      indexStart: newIndexStart,
      indexEnd: newIndexEnd,
    };
  }
}
