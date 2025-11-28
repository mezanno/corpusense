import { Annotation, ElementType, getAnnotationType } from '@/data/models/Annotation';
import { Collection, CollectionDetails } from '@/data/models/Collection';
import { Canvas } from '@iiif/presentation-3';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface CollectionsState {
  values: CollectionDetails[]; // List of all collections to show in the collection list
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

const initialState: CollectionsState = {
  values: [],
  openedCollections: [],
};

export const collectionsSlice = createSlice({
  name: 'collections',
  initialState,
  reducers: {
    loadCollectionRequest: (_state, _action: PayloadAction<string>) => {},
    loadCollectionSuccess: (
      state,
      action: PayloadAction<{
        collection: Collection;
        canvases: Canvas[];
        canvasHasOcrAnnotations: Record<string, boolean>;
      }>,
    ) => {
      const { collection, canvases, canvasHasOcrAnnotations } = action.payload;
      state.currentCollection = collection;
      if (state.openedCollections.find((id) => id === collection.id) === undefined) {
        state.openedCollections.push(collection.id);
      }
      state.loadedCanvases = canvases.reduce(
        (acc, canvas) => {
          acc[canvas.id] = {
            content: canvas,
            infos: {
              hasOcrAnnotations: canvasHasOcrAnnotations[canvas.id],
            },
          };
          return acc;
        },
        {} as Record<string, { content: Canvas; infos: { hasOcrAnnotations?: boolean } }>,
      );
    },
    fetchCanvasesOfCollectionRequest: (_state, _action: PayloadAction<string>) => {},
    fetchCanvasesOfCollectionSuccess: (state, action: PayloadAction<Collection>) => {
      // const list: List = state.values.find((elt) => elt.id === action.payload.id);
      console.log(
        'fetchCanvasesOfCollectionSuccess: ',
        state.values.find((elt) => elt.id === action.payload.id),
      );
    },
    removeFromOpenedCollections: (state, action: PayloadAction<string>) => {
      const collectionId: string = action.payload;
      state.openedCollections = state.openedCollections.filter((id) => id !== collectionId);
    },
    updateOcrStatus: (state, action: PayloadAction<Annotation[]>) => {
      action.payload.forEach((annotation) => {
        if (
          annotation.collectionId === state.currentCollection?.id &&
          state.loadedCanvases?.[annotation.canvasId] !== undefined &&
          getAnnotationType(annotation) === ElementType.TEXT_LINE
        ) {
          state.loadedCanvases[annotation.canvasId] = {
            ...state.loadedCanvases[annotation.canvasId],
            infos: {
              ...state.loadedCanvases[annotation.canvasId].infos,
              hasOcrAnnotations: true,
            },
          };
        }
      });
    },
    setOcrStatus: (state, action: PayloadAction<Record<string, boolean>>) => {
      for (const canvasId in action.payload) {
        if (state.loadedCanvases?.[canvasId] !== undefined) {
          state.loadedCanvases[canvasId] = {
            ...state.loadedCanvases[canvasId],
            infos: {
              ...state.loadedCanvases[canvasId].infos,
              hasOcrAnnotations: action.payload[canvasId],
            },
          };
        }
      }
    },
    toggleCollectionOfflineRequest: (
      _state,
      _action: PayloadAction<string>, // collectionId
    ) => {},
  },
});

export const {
  loadCollectionRequest,
  loadCollectionSuccess,
  removeFromOpenedCollections,
  updateOcrStatus,
  setOcrStatus,
  toggleCollectionOfflineRequest,
} = collectionsSlice.actions;
export default collectionsSlice.reducer;
