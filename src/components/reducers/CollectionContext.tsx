import { Collection } from '@/data/models/Collection';
import { Canvas } from '@iiif/presentation-3';
import { createContext, useCallback, useContext, useReducer } from 'react';

export const ACTIONS = {
  OPEN_COLLECTION: 'OPEN_COLLECTION',
} as const;

export type CollectionContextAction = {
  type: typeof ACTIONS.OPEN_COLLECTION;
  payload: { collectionId: string };
};

function CollectionContextReducer(
  state: CollectionContextState,
  action: CollectionContextAction,
): CollectionContextState {
  switch (action.type) {
    case ACTIONS.OPEN_COLLECTION:
      if (state.openedCollections.includes(action.payload.collectionId)) {
        return state;
      }
      return {
        ...state,
        openedCollections: [...state.openedCollections, action.payload.collectionId],
      };
    default:
      return state;
  }
}

export interface CollectionContextState {
  openedCollections: string[];
  currentCollection?: Collection; //the collection currently being viewed in the collection inspector
  loadedCanvases?: Record<
    string, //canvasId
    {
      //the canvases loaded for the current collection
      content: Canvas;
      infos: {
        hasOcrAnnotations?: boolean;
        hasOfflineImage?: boolean;
      };
    }
  >;
}

export const initialValues: CollectionContextState = {
  openedCollections: [],
};

type CollectionContextType = CollectionContextState & {
  openCollection: (collectionId: string) => void;
};

export const CollectionContext = createContext<CollectionContextType | undefined>(undefined);

export const CollectionProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(CollectionContextReducer, initialValues);

  const openCollection = useCallback(
    (collectionId: string) =>
      dispatch({ type: ACTIONS.OPEN_COLLECTION, payload: { collectionId } }),
    [dispatch],
  );

  return (
    <CollectionContext.Provider value={{ ...state, openCollection }}>
      {children}
    </CollectionContext.Provider>
  );
};

export const useCollectionContext = () => {
  const context = useContext(CollectionContext);
  if (context === undefined) {
    throw new Error('useCollectionContext must be used within a CollectionProvider');
  }
  return context;
};
