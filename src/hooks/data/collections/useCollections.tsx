import { Collection, CollectionDetails } from '@/data/models/collection/collection';
import {
  getAnnotationRepository,
  getCollectionLiveRepository,
  getCollectionRepository,
} from '@/data/repositories/indexeddb/dbFactory';
import { generateFirstAnnotation } from '@/data/utils/annotations';
import { generateCollectionContent } from '@/data/utils/collections';
import i18n from '@/i18n';
import { pushError, pushInfo } from '@/state/reducers/events';
import { BaseError } from '@/utils/BaseError';
import { FunctionResult } from '@/utils/functionResult';
import { getErrorMessage } from '@/utils/utils';
import { Canvas } from '@iiif/presentation-3';
import { useLiveQuery } from 'dexie-react-hooks';
import { useCallback, useMemo } from 'react';
import { useAppDispatch } from '../../hooks';

export const useCollections = () => {
  const appDispatch = useAppDispatch();
  const collectionLiveRepository = useMemo(() => getCollectionLiveRepository(), []);
  const collectionRepository = useMemo(() => getCollectionRepository(), []);

  const collections = useLiveQuery(
    collectionLiveRepository.getAllDetails(),
    [],
    [] as CollectionDetails[],
  );

  const collectionCount = useMemo(() => {
    return collections.length;
  }, [collections]);

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
        name,
        tags: [],
        content: [],
        contentSize: 0,
      });
      appDispatch(pushInfo(i18n.t('toast_collection_created')));
    } catch (e) {
      appDispatch(pushError(getErrorMessage(e)));
    }
  };

  const createCollectionWithSelection = async (
    selection: Canvas[],
    name: string,
    sourceId: string,
  ): Promise<FunctionResult<CollectionDetails, BaseError>> => {
    const newCollection = {
      name,
      tags: [],
      contentSize: selection.length,
    };
    const content = generateCollectionContent(
      selection.map((c) => c.id),
      sourceId,
    );

    const createResult = await collectionRepository.create({
      ...newCollection,
      content,
    });
    if (createResult.ok) {
      appDispatch(pushInfo(i18n.t('toast_collection_created')));
      // const firstAnnotations = generateFirstAnnotation(selection, collection.id);
      // const annotationRepository = getAnnotationRepository();
      // await annotationRepository.addAll(firstAnnotations);
    } else {
      appDispatch(pushError(getErrorMessage(createResult.error)));
    }
    return createResult;
  };

  const duplicateCollection = async (collectionId: string, newName: string) => {
    const result = await collectionRepository.duplicate(collectionId, newName);
    if (result.ok) {
      appDispatch(pushInfo(i18n.t('toast_collection_duplicated')));
    } else {
      appDispatch(pushError(getErrorMessage(result.error)));
    }
  };

  /**
   * @remarks if some canvas are already in the collection, they will not be added again (but there is no error dispatched!)
   * @param action
   * @returns
   */
  const addSelectionToCollection = async (action: {
    selection: Canvas[];
    collectionId: string;
    sourceId: string;
  }) => {
    const { selection, collectionId, sourceId } = action;

    const collectionResult = await collectionRepository.getById(collectionId);
    if (!collectionResult.ok) {
      appDispatch(pushError(getErrorMessage(collectionResult.error)));
      return;
    }
    const collection = collectionResult.value;
    try {
      //we check the existing content of the collection and add only the new canvases
      const existingContent = collection.content ?? [];
      const existingCanvasIds = existingContent.map((elt) => elt.canvasId);
      const newContent = generateCollectionContent(
        selection.map((canvas) => canvas.id),
        sourceId,
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
    const {
      id,
      name,
      about,
      tags,
      content,
      modelId,
      postLayoutModifierChainId,
      postOcrModifierChainId,
    } = collection;
    try {
      if (id === undefined) {
        return;
      }
      await collectionRepository.update(id, {
        name,
        about,
        tags,
        content,
        modelId,
        postLayoutModifierChainId,
        postOcrModifierChainId,
      });

      appDispatch(pushInfo(i18n.t('toast_collection_saved')));
    } catch (e) {
      appDispatch(pushError(getErrorMessage(e)));
    }
  };

  const removeElementFromCollection = async (collectionId: string, canvasId: string) => {
    return await collectionRepository.deleteElement(collectionId, canvasId);
  };

  const removeCollection = async (id: string) => {
    const collectionToRemoveResult = await collectionRepository.getById(id);
    if (!collectionToRemoveResult.ok) {
      appDispatch(pushError(getErrorMessage(collectionToRemoveResult.error)));
      return;
    }
    const deleteResult = await collectionRepository.deleteById(id);
    if (!deleteResult.ok) {
      appDispatch(pushError(getErrorMessage(deleteResult.error)));
      return;
    }
    appDispatch(pushInfo(i18n.t('toast_collection_deleted')));
  };

  const removeMultipleCollections = async (ids: string[]) => {
    for (const id of ids) {
      const collectionToRemoveResult = await collectionRepository.getById(id);
      if (!collectionToRemoveResult.ok) {
        appDispatch(pushError(getErrorMessage(collectionToRemoveResult.error)));
        continue;
      }
      const deleteResult = await collectionRepository.deleteById(id);
      if (!deleteResult.ok) {
        appDispatch(pushError(getErrorMessage(deleteResult.error)));
        continue;
      }
      appDispatch(pushInfo(i18n.t('toast_collection_deleted')));
    }
  };

  return {
    collections,
    collectionCount,
    getCollectionById,
    nameAlreadyExists,
    createCollection,
    createCollectionWithSelection,
    duplicateCollection,
    addSelectionToCollection,
    updateCollection,
    removeElementFromCollection,
    removeCollection,
    removeMultipleCollections,
  };
};
