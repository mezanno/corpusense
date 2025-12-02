import { Collection, CollectionDetails } from '@/data/models/Collection';
import {
  getAnnotationRepository,
  getCollectionRepository,
  getCollectonLiveRepository,
} from '@/data/repositories/indexeddb/dbFactory';
import { generateFirstAnnotation } from '@/data/utils/annotations';
import { generateCollectionContent } from '@/data/utils/collections';
import i18n from '@/i18n';
import { pushError, pushInfo } from '@/state/reducers/events';
import { removeWorkersSuccess } from '@/state/reducers/workers';
import { getErrorMessage } from '@/utils/utils';
import { Canvas } from '@iiif/presentation-3';
import { useLiveQuery } from 'dexie-react-hooks';
import { useCallback, useMemo } from 'react';
import { v4 as uuid } from 'uuid';
import { useAppDispatch } from '../../hooks';

export interface CreateCollectionWithSelectionPayload {
  selection: Canvas[];
  name: string;
  id?: string;
  manifestId: string;
}

export const useCollections = () => {
  const appDispatch = useAppDispatch();
  const collectionLiveRepository = useMemo(() => getCollectonLiveRepository(), []);
  const collectionRepository = useMemo(() => getCollectionRepository(), []);

  const collections = useLiveQuery(
    collectionLiveRepository.getAllDetails(),
    [],
    [] as CollectionDetails[],
  );

  const getCollectionById = useCallback(
    (id: string) => collections.find((c) => c.id === id),
    [collections],
  );

  const nameAlreadyExists = useCallback(
    (name: string) => {
      return collections.find((c) => c.name.toLowerCase() === name.toLowerCase()) !== undefined;
    },
    [collections],
  );

  const createCollection = async (name: string) => {
    try {
      await collectionRepository.create({
        id: uuid(),
        name,
        tags: [],
        contentSize: 0,
        content: [],
        offline: false,
      });
      appDispatch(pushInfo(i18n.t('toast_collection_created')));
    } catch (e) {
      appDispatch(pushError(getErrorMessage(e)));
    }
  };

  const createCollectionWithSelection = async (action: CreateCollectionWithSelectionPayload) => {
    const { id, name, selection, manifestId } = action;
    const collectionId = id ?? uuid();
    const newCollection: CollectionDetails = {
      id: collectionId,
      name,
      tags: [],
      contentSize: selection.length,
      offline: false,
    };
    const content = generateCollectionContent(
      0,
      selection.map((c) => c.id),
      manifestId,
    );

    try {
      await collectionRepository.create({
        ...newCollection,
        content,
      });
      if (id === undefined) {
        //if an id was provided, it means it is an import, so we don't need to create the first annotations
        const firstAnnotations = generateFirstAnnotation(selection, collectionId);
        const annotationRepository = getAnnotationRepository();
        await annotationRepository.addAll(firstAnnotations);
      }
      appDispatch(pushInfo(i18n.t('toast_collection_created')));
    } catch (e) {
      appDispatch(pushError(getErrorMessage(e)));
    }

    return { ...newCollection, content };
  };

  /**
   * @remarks if some canvas are already in the collection, they will not be added again (but there is no error dispatched!)
   * @param action
   * @returns
   */
  const addSelectionToCollection = async (action: {
    selection: Canvas[];
    collectionId: string;
    manifestId: string;
  }) => {
    const { selection, collectionId, manifestId } = action;
    try {
      const collection = await collectionRepository.getById(collectionId);

      //we check the existing content of the collection and add only the new canvases
      const existingContent = collection.content ?? [];
      const existingCanvasIds = existingContent.map((elt) => elt.canvasId);
      const newContent = generateCollectionContent(
        existingContent.length - 1,
        selection.map((canvas) => canvas.id),
        manifestId,
        existingCanvasIds,
      );
      const updatedCollection = {
        ...collection,
        contentSize: existingContent.length + newContent.length,
        content: [...existingContent, ...newContent],
      };
      await collectionRepository.addContentToCollection(updatedCollection);
      //Add first annotations for the new canvases
      const firstAnnotations = generateFirstAnnotation(selection, collectionId, existingCanvasIds);
      const annotationRepository = getAnnotationRepository();
      await annotationRepository.addAll(firstAnnotations);
      if (selection.length === 1) {
        appDispatch(pushInfo(i18n.t('toast_one_element_added')));
      } else if (selection.length > 1) {
        appDispatch(pushInfo(i18n.t('toast_multiple_elements_added', { count: selection.length })));
      }
    } catch (e) {
      appDispatch(pushError(getErrorMessage(e)));
    }
  };

  const updateCollection = async (collection: Collection) => {
    const { id, name, tags, content, modelId, offline } = collection;
    try {
      if (id === undefined) {
        // yield put(setError(i18next.t('error_collection_not_found')));
        return;
      }
      await collectionRepository.update(id, {
        name,
        tags,
        content,
        modelId,
        offline,
      });

      appDispatch(pushInfo(i18n.t('toast_collection_saved')));
    } catch (e) {
      appDispatch(pushError(getErrorMessage(e)));
    }
  };

  const removeElementFromCollection = async (collectionId: string, canvasId: string) => {
    try {
      await collectionRepository.deleteElement(collectionId, canvasId);
      appDispatch(pushInfo(i18n.t('toast_element_removed')));
    } catch (e) {
      appDispatch(pushError(getErrorMessage(e)));
    }
  };

  const removeCollection = async (id: string) => {
    try {
      const collectionToRemove = await collectionRepository.getById(id);

      const { workersIds } = await collectionRepository.delete(collectionToRemove);
      //TODO: to remove --> useLiveQuery pour les workers
      appDispatch(removeWorkersSuccess(workersIds)); //remove workers associated to the collection
      //A priori, plus besoin de prévenir le store, si on supprime une collection, c'est que l'on est sur la page des collections
      // yield put(removeAnnotationSuccess(collectionId));
      appDispatch(pushInfo(i18n.t('toast_collection_deleted')));
    } catch (e) {
      appDispatch(pushError(getErrorMessage(e)));
    }
  };

  return {
    collections,
    getCollectionById,
    nameAlreadyExists,
    createCollection,
    createCollectionWithSelection,
    addSelectionToCollection,
    updateCollection,
    removeElementFromCollection,
    removeCollection,
  };
};
