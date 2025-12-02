// import { createSelector } from '@reduxjs/toolkit';
// import { RootState } from '../store';

// export const selectCollectionsByIds = createSelector(
//   [
//     (state: RootState) => state.collections?.values ?? [],
//     (_: RootState, collectionIds: string[]) => collectionIds,
//   ],
//   (values, collectionIds) => values.filter((elt) => collectionIds.includes(elt.id)),
// );

// export const selectCollectionNameExists = createSelector(
//   [(state: RootState) => state.collections?.values ?? [], (_: RootState, name: string) => name],
//   (values, name) =>
//     values.find((elt) => elt.name.toLowerCase() === name.toLowerCase()) !== undefined,
// );

// export const selectCurrentCollection = (state: RootState) => state.collections?.currentCollection;

// export const selectOpenedCollections = createSelector(
//   [
//     (state: RootState) => state.collections?.values ?? [],
//     (state: RootState) => state.collections?.openedCollections ?? [],
//   ],
//   (values, openedCollections) =>
//     values.filter((elt) => openedCollections.find((id) => id === elt.id) !== undefined),
// );

// export const selectLoadedCanvasById = (state: RootState, canvasId: string) =>
//   state.collections?.loadedCanvases?.[canvasId]?.content ?? null;

// export const selectModelIdOfCollection = createSelector(
//   [
//     (state: RootState) => state.collections?.values ?? [],
//     (_: RootState, collectionId: string) => collectionId,
//   ],
//   (values, collectionId) => values.find((elt) => elt.id === collectionId)?.modelId,
// );

// export const selectCanvasHasOcrAnnotations = (state: RootState, canvasId: string) =>
//   state.collections?.loadedCanvases?.[canvasId]?.infos.hasOcrAnnotations ?? false;

// export const selectIsCollectionOffline = createSelector(
//   [
//     (state: RootState) => state.collections?.values ?? [],
//     (_: RootState, collectionId: string) => collectionId,
//   ],
//   (values, collectionId) => values.find((elt) => elt.id === collectionId)?.offline ?? false,
// );
