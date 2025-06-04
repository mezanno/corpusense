import { Annotation } from '@/data/models/Annotation';
import { Collection, ExportedCollection } from '@/data/models/Collection';
import { NamedEntity } from '@/data/models/NamedEntity';
import { SelectedCanvas } from '@/data/models/SelectedCanvas';
import { StoredItem } from '@/data/models/StoredItem';
import {
  getAnnotationRepository,
  getCanvasRepository,
  getCollectionRepository,
  getManifestRepository,
  getNamedEntityRepository,
  getStoredItemRepository,
  getTagRepository,
} from '@/data/repositories/indexeddb/dbFactory';
import { generateFirstAnnotation, importAnnotationFromJson } from '@/data/utils/annotations';
import { generateCollectionContent } from '@/data/utils/collections';
import { Canvas } from '@iiif/presentation-3';
import { PayloadAction } from '@reduxjs/toolkit';
import i18next from 'i18next';
import JSZip from 'jszip';
import {
  call,
  CallEffect,
  Effect,
  put,
  PutEffect,
  takeEvery,
  takeLatest,
} from 'redux-saga/effects';
import { v4 as uuid } from 'uuid';
import { fetchAnnotationsSuccess } from '../reducers/annotations';
import {
  addCollectionToHistoryRequest,
  addSelectionToCollectionRequest,
  addSelectionToCollectionSuccess,
  createCollectionRequest,
  createCollectionSuccess,
  createCollectionWithSelectionRequest,
  importMultipleCollectionsRequest,
  importOneCollectionRequest,
  removeCollectionRequest,
  removeCollectionSuccess,
  removeElementFromCollectionRequest,
  removeElementFromCollectionSuccess,
  setCollections,
  setError,
  updateCollectionRequest,
  updateCollectionSuccess,
} from '../reducers/collections';
import { loadEntitiesSuccess } from '../reducers/namedEntities';
import { setStoredItems } from '../reducers/storedItems';
import { handleRemoveAllCollectionAnnotations } from './annotations';
import { loadStoredElements } from './storedItems';

function* fetchAllCollections(): Generator<
  CallEffect<Collection[]> | PutEffect,
  void,
  Collection[]
> {
  try {
    const collectionRepository = getCollectionRepository();
    const collections: Collection[] = yield call([
      collectionRepository,
      collectionRepository.getAll,
    ]);

    yield put(setCollections(collections));
  } catch (e) {
    console.warn('Error loading collections from indexedDB', e);
  }
}

function* handleCreateCollection(action: PayloadAction<string>) {
  const name = action.payload;
  const newCollection: Collection = { id: uuid(), name, tags: [], content: [] };

  try {
    const collectionRepository = getCollectionRepository();
    yield call([collectionRepository, collectionRepository.insertCollection], newCollection);
    yield put(createCollectionSuccess(newCollection));
  } catch (e) {
    console.log('error', e);
    yield put(setError(e));
  }
}

function* handleUpdateCollection(action: PayloadAction<Collection>) {
  const { id, name, tags, content } = action.payload;
  try {
    if (id === undefined) {
      yield put(setError(i18next.t('error_collection_not_found')));
      return;
    }
    const collectionRepository = getCollectionRepository();
    yield call([collectionRepository, collectionRepository.update], id, {
      name,
      tags,
      content,
    });

    yield put(updateCollectionSuccess(action.payload));
  } catch (e) {
    console.log('error', e);
    yield put(setError(e));
  }
}

/**

 * @param action id of the collection to remove
 */
function* handleRemoveCollection(
  action: PayloadAction<string>,
): Generator<Effect, void, Collection> {
  const { payload } = action; //id of the collection to remove
  try {
    const collectionRepository = getCollectionRepository();
    const collectionToRemove = yield call(
      [collectionRepository, collectionRepository.getCollectionById],
      payload,
    );
    yield call([collectionRepository, collectionRepository.remove], collectionToRemove);

    yield call(handleRemoveAllCollectionAnnotations, action); //delete the annotations of the collection
    yield put(removeCollectionSuccess(payload));
  } catch (e) {
    console.log('error', e);
    yield put(setError(e));
  }
}

/**
 * @remarks if some canvas are already in the collection, they will not be added again (but there is no error dispatched!)
 * @param action
 * @returns
 */
function* handleAddSelectionToCollection(
  action: PayloadAction<{ selection: SelectedCanvas[]; collectionId: string; manifestId: string }>,
): Generator<Effect, void, Collection> {
  const { selection, collectionId, manifestId } = action.payload;

  try {
    const collectionRepository = getCollectionRepository();
    const collection = yield call(
      [collectionRepository, collectionRepository.getCollectionById],
      collectionId,
    );

    if (collection.content === null || collection.content === undefined) {
      collection.content = [];
    }
    const existingCanvasIds = collection.content.map((elt) => elt.canvasId);
    const newContent = generateCollectionContent(
      collection.content.length - 1,
      selection,
      collectionId,
      manifestId,
      existingCanvasIds,
    );
    collection.content = [...collection.content, ...newContent];
    yield call(
      [collectionRepository, collectionRepository.saveCollectionContent],
      collection,
      selection,
    );

    const firstAnnotations = generateFirstAnnotation(selection, collectionId, existingCanvasIds);
    const annotationRepository = getAnnotationRepository();
    yield call([annotationRepository, annotationRepository.saveAllAnnotations], firstAnnotations);
    yield call(loadStoredElements); //TODO: ? est-ce nécessaire de tout recharger ?
    yield put(addSelectionToCollectionSuccess(collection));
  } catch (e) {
    console.log('error', e);
    yield put(setError(e));
  }
}

export interface CreateCollectionWithSelectionPayload {
  selection: SelectedCanvas[];
  name: string;
  id?: string;
  manifestId: string;
}

function* handleCreateCollectionWithSelection(
  action: PayloadAction<CreateCollectionWithSelectionPayload>,
): Generator<Effect, Collection, Collection | undefined> {
  const { id, name, selection, manifestId } = action.payload;
  const collectionId = id ?? uuid();
  const newCollection: Collection = { id: collectionId, name, tags: [], content: [] };
  newCollection.content = generateCollectionContent(0, selection, collectionId, manifestId);

  try {
    const collectionRepository = getCollectionRepository();
    yield call([collectionRepository, collectionRepository.insertCollection], newCollection);
    yield call(
      [collectionRepository, collectionRepository.saveCollectionContent],
      newCollection,
      selection,
    );
    if (id === undefined) {
      //if an id was provided, it means it is an import, so we don't need to create the first annotations
      const firstAnnotations = generateFirstAnnotation(selection, collectionId);
      const annotationRepository = getAnnotationRepository();
      yield call([annotationRepository, annotationRepository.saveAllAnnotations], firstAnnotations);
    }
    yield call(loadStoredElements); //il faut appeler le saga pour mettre à jour le state //TODO: ? est-ce nécessaire de tout recharger ?
    yield put(createCollectionSuccess(newCollection));
  } catch (e) {
    console.log('error', e);
    yield put(setError(e));
  }

  return newCollection;
}

function* handleRemoveElementFromCollection(
  action: PayloadAction<{ collectionId: string; canvasId: string }>,
): Generator<Effect, void, Collection> {
  const { collectionId, canvasId } = action.payload;
  try {
    const collectionRepository = getCollectionRepository();
    const updatedCollection = yield call(
      [collectionRepository, collectionRepository.removeElement],
      collectionId,
      canvasId,
    );
    yield put(removeElementFromCollectionSuccess(updatedCollection));
  } catch (e) {
    console.log('error', e);
    yield put(setError(e));
  }
}

function* handleImportMultipleCollections(
  action: PayloadAction<ArrayBuffer>,
): Generator<Effect, void, JSZip | string> {
  const zip = new JSZip();
  const zipContent = (yield call(() => zip.loadAsync(action.payload))) as JSZip;
  for (const fileName in zipContent.files) {
    const file = zipContent.files[fileName];
    if (!file.dir) {
      const fileContent = (yield call(() => file.async('string'))) as string;
      try {
        const json = JSON.parse(fileContent) as object;
        yield call(handleImportOneCollection, {
          payload: json,
          type: importOneCollectionRequest.type,
        });
      } catch (e) {
        console.log('error', e);
        yield put(setError(e));
      }
    }
  }
}

function* handleImportOneCollection(
  _action: PayloadAction<object>,
): Generator<Effect, void, boolean> {
  const json = _action.payload;
  if ('type' in json && json.type !== 'Manifest') {
    console.log('not a manifest');
    return;
  }
  const manifest = json as ExportedCollection;

  const items = manifest.items ?? [];
  if (items.length === 0) {
    console.log('no items to import');
    return;
  }

  const collectionName = manifest.label?.none?.[0] ?? 'Imported collection'; //TODO change default name
  const collectionId = uuid(); //TODO change default id

  console.log(`Importing ${collectionName} (${collectionId})`);

  //add the tags
  const tags = manifest.tags ?? [];
  const tagRepository = getTagRepository();
  yield call([tagRepository, tagRepository.saveTags], tags);

  const selectedCanvas = [];
  //add the canvas
  const canvasRepository = getCanvasRepository();
  for (let i = 0; i < items.length; i++) {
    const canvas = items[i];
    const isCanvasStored = yield call([canvasRepository, canvasRepository.exists], canvas.id);
    if (!isCanvasStored) {
      yield call([canvasRepository, canvasRepository.add], canvas);
    }
    selectedCanvas.push({
      canvas,
      index: i,
    });
    //import annotations
    const annotationPages = canvas.annotations;
    if (annotationPages !== undefined) {
      for (let j = 0; j < annotationPages.length; j++) {
        const annotationPage = annotationPages[j];
        if (annotationPage.id.endsWith('.json')) {
          continue;
        } else {
          yield call(importAnnotationFromJson, annotationPage, collectionId);
        }
      }
    }
  }

  const result = yield call(handleCreateCollectionWithSelection, {
    payload: {
      selection: selectedCanvas,
      name: collectionName,
      id: collectionId,
      manifestId: manifest.id,
    },
    type: createCollectionWithSelectionRequest.type,
  });
  const newCollection = result as unknown as Collection;
  if (newCollection.id === undefined) {
    yield put(setError(i18next.t('error_collection_not_found')));
    return;
  }
  const collectionRepository = getCollectionRepository();
  yield call(
    [collectionRepository, collectionRepository.updateTags],
    newCollection.id,
    tags.map((tag) => tag.id),
  );
  yield put(updateCollectionSuccess({ ...newCollection, tags: tags.map((tag) => tag.id) }));
}

function* handleLoadCollection(
  action: PayloadAction<string>,
): Generator<Effect, void, Collection[] | StoredItem[] | Canvas | Annotation[] | NamedEntity[]> {
  try {
    const collectionRepository = getCollectionRepository();
    const canvasRepository = getCanvasRepository();
    const storedItemRepository = getStoredItemRepository();
    const collectionId = action.payload;
    //reload all the collections

    const collections = (yield call([
      collectionRepository,
      collectionRepository.getAll,
    ])) as Collection[];
    yield put(setCollections(collections));

    //get the collection to load
    const collectionToLoad = collections.find((collection) => collection.id === collectionId);
    if (collectionToLoad === undefined) {
      yield put(setError(i18next.t('error_collection_not_found')));
      return;
    }

    //check if the canvas are already in the storedItems, if not add them to the storedItems
    const contentToLoad = collectionToLoad.content.map((elt) => ({
      canvasId: elt.canvasId,
      manifestId: elt.manifestId,
    }));
    const storedItems = (yield call([
      storedItemRepository,
      storedItemRepository.getAll,
    ])) as StoredItem[];
    const storedCanvasIds = storedItems.map((elt) => elt.id);
    const contentToAdd = contentToLoad.filter((elt) => !storedCanvasIds.includes(elt.canvasId));
    if (contentToAdd.length > 0) {
      for (const content of contentToAdd) {
        const manifestRepository = getManifestRepository();
        const canvas = (yield call(
          [manifestRepository, manifestRepository.getCanvases],
          content.manifestId,
          content.canvasId,
        )) as Canvas;
        if (canvas !== undefined) {
          yield call([canvasRepository, canvasRepository.add], canvas);
        }
      }
      const newStoredItems = (yield call([
        storedItemRepository,
        storedItemRepository.getAll,
      ])) as StoredItem[];
      yield put(setStoredItems(newStoredItems));
    }

    //load all the annotations of the collection
    const annotationRepository = getAnnotationRepository();
    const annotations = (yield call(
      [annotationRepository, annotationRepository.getAnnotationsForCollection],
      collectionId,
    )) as Annotation[];
    yield put(fetchAnnotationsSuccess(annotations));

    //load the entities of the collection
    const annotationsIds = annotations.map((annotation) => annotation.id);
    const namedEntityRepository = getNamedEntityRepository();
    const namedEntities = (yield call(
      [namedEntityRepository, namedEntityRepository.getNamedEntitiesByAnnotationsIds],
      annotationsIds,
    )) as NamedEntity[];
    yield put(loadEntitiesSuccess(namedEntities));
  } catch (e) {
    console.log('error', e);
    yield put(setError(e));
  }
}

export default function* collectionsSaga() {
  yield takeEvery(createCollectionRequest, handleCreateCollection);
  yield takeEvery(removeCollectionRequest, handleRemoveCollection);
  yield takeEvery(createCollectionWithSelectionRequest, handleCreateCollectionWithSelection);
  yield takeEvery(addSelectionToCollectionRequest, handleAddSelectionToCollection);
  yield takeEvery(removeElementFromCollectionRequest, handleRemoveElementFromCollection);
  yield takeEvery(updateCollectionRequest, handleUpdateCollection);
  yield takeEvery(importOneCollectionRequest, handleImportOneCollection);
  yield takeEvery(importMultipleCollectionsRequest, handleImportMultipleCollections);
  yield takeLatest(addCollectionToHistoryRequest, handleLoadCollection);
}

export {
  fetchAllCollections,
  handleAddSelectionToCollection,
  handleCreateCollection,
  handleCreateCollectionWithSelection,
  handleImportMultipleCollections,
  handleImportOneCollection,
  handleLoadCollection,
  handleRemoveCollection,
  handleRemoveElementFromCollection,
  handleUpdateCollection,
};
