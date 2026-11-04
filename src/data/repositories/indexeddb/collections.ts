import { CollectionCreateDTO } from '@/data/models/collection/collection.dto';
import { CollectionElement } from '@/data/models/collectionElement';
import { AnnotationScope, CanvasScope } from '@/data/models/scope/scope';
import { Tag } from '@/data/models/tag';
import { DBError } from '@/data/utils/errors';
import { CanvasWithSourceId } from '@/hooks/data/collections/useCollectionContent';
import { FunctionResult } from '@/utils/functionResult';
import { getErrorMessage } from '@/utils/utils';
import { Canvas } from '@iiif/presentation-3';
import { groupBy, mapValues } from 'lodash';
import { v4 as uuid } from 'uuid';
import { Collection, CollectionDetails } from '../../models/collection/collection';
import { EntityNotFoundError } from '../EntityNotFoundError';
import { db } from './db';
import {
  getAnnotationRepository,
  getSourceRepository,
  getTagRepository,
  getWorkerRepository,
} from './dbFactory';
import { CollectionRepository } from './types';

export class IndexedDBCollectionRepository implements CollectionRepository {
  async getAllDetails(): Promise<CollectionDetails[]> {
    return await db.collections.toArray();
  }

  async getById(id: string): Promise<FunctionResult<Collection, EntityNotFoundError>> {
    const details = await db.collections.get(id);
    if (details === undefined) {
      return FunctionResult.err(new EntityNotFoundError({ entity: 'Collection', id }));
    }

    const content = await db.collectionContents.get(id);
    return FunctionResult.ok({ ...details, content: content?.content || [] });
  }

  async getTagsByCollectionId(
    collectionId: string,
  ): Promise<FunctionResult<Tag[], EntityNotFoundError>> {
    const result = await this.getById(collectionId);
    if (!result.ok) {
      return result;
    }
    const tagIds = result.value.tags;
    if (tagIds.length === 0) {
      return FunctionResult.ok([]);
    }
    const tagRepository = getTagRepository();
    return FunctionResult.ok(await tagRepository.getByIds(tagIds));
  }

  async getCanvasesByCollectionId(
    collectionId: string,
  ): Promise<FunctionResult<Canvas[], EntityNotFoundError>> {
    const result = await this.getById(collectionId);
    if (!result.ok) {
      return result;
    }

    const collectionContent = await db.collectionContents.get(collectionId);
    const content = collectionContent?.content || [];
    if (content.length === 0) {
      return FunctionResult.ok([]);
    }

    const sourceRepository = getSourceRepository();

    //get the list of canvases in the collection (with their manifestId), in their collection order
    const canvaseIdsWithSourceIds = (
      await Promise.all(
        content.map(async (elt) => {
          return FunctionResult.match(await sourceRepository.getContentById(elt.sourceId), {
            ok: (source) => ({
              canvasId: elt.canvasId,
              sourceId: source.id,
            }),
            err: () => null,
          });
        }),
      )
    ).filter((c): c is { canvasId: string; sourceId: string } => c !== null);

    const canvasesBySourceId = groupBy(canvaseIdsWithSourceIds, 'sourceId');

    //group the canvases by manifestId
    const groupedCanvasesIds = mapValues(canvasesBySourceId, (value) =>
      value.map((elt) => elt.canvasId),
    );

    const canvases: Canvas[] = [];
    for (const sourceId in groupedCanvasesIds) {
      const canvasIds = groupedCanvasesIds[sourceId];
      if (canvasIds.length > 0) {
        const results = await Promise.all(
          canvasIds.map((id) => sourceRepository.getCanvasById(sourceId, id)),
        );
        for (const res of results) {
          if (res.ok) {
            canvases.push(res.value);
          }
        }
      }
    }

    return FunctionResult.ok(canvases);
  }

  async getSourceIdsByCollectionId(
    collectionId: string,
  ): Promise<FunctionResult<string[], EntityNotFoundError>> {
    const result = await this.getById(collectionId);
    return FunctionResult.map(result, (col) => [
      ...new Set(col.content.map((elt) => elt.sourceId)),
    ]);
  }

  async getCanvasByScope(
    scope: CanvasScope | AnnotationScope,
  ): Promise<FunctionResult<CanvasWithSourceId, EntityNotFoundError>> {
    const result = await this.getById(scope.collectionId);
    if (!result.ok) {
      return result;
    }

    const collectionElement = result.value.content.find((elt) => elt.canvasId === scope.canvasId);
    if (!collectionElement) {
      return FunctionResult.err(
        new EntityNotFoundError({ entity: 'CollectionElement', id: scope.canvasId }),
      );
    }

    const canvasResult = await getSourceRepository().getCanvasById(
      collectionElement.sourceId,
      scope.canvasId,
    );
    if (!canvasResult.ok) {
      return canvasResult;
    }

    return FunctionResult.ok({
      canvas: canvasResult.value,
      sourceId: collectionElement.sourceId,
    });
  }

  async exists(id: string): Promise<boolean> {
    const count = await db.collections.where('id').equals(id).count();
    return count > 0;
  }

  async create(collectionDTO: CollectionCreateDTO): Promise<FunctionResult<Collection, DBError>> {
    const collectionId = uuid();
    const now = new Date().toISOString();
    const newCollection = {
      ...collectionDTO,
      id: collectionId,
      createdAt: now,
      updatedAt: now,
    };
    try {
      await db.transaction('rw', db.collections, db.collectionContents, async () => {
        const { content, ...collectionDetails } = newCollection;
        await db.collections.add(collectionDetails);
        await db.collectionContents.add({
          id: collectionId,
          content: content ?? [],
        });
      });
      return FunctionResult.ok(newCollection);
    } catch (error) {
      return FunctionResult.err(new DBError({ message: getErrorMessage(error) }));
    }
  }

  async add(collection: Collection): Promise<FunctionResult<void, DBError>> {
    try {
      await db.transaction('rw', db.collections, db.collectionContents, async () => {
        const { content, ...collectionDetails } = collection;
        await db.collections.add(collectionDetails);
        await db.collectionContents.add({
          id: collection.id,
          content: content ?? [],
        });
      });
      return FunctionResult.ok(undefined);
    } catch (error) {
      return FunctionResult.err(new DBError({ message: getErrorMessage(error) }));
    }
  }

  async duplicate(
    collectionId: string,
    newName: string,
  ): Promise<FunctionResult<CollectionDetails, EntityNotFoundError>> {
    const collectionResult = await this.getById(collectionId);
    if (!collectionResult.ok) {
      return collectionResult;
    }
    const collection = collectionResult.value;
    const content = await db.collectionContents.get(collectionId);

    const newCollectionId = uuid();
    const newCollection: CollectionDetails = {
      ...collection,
      id: newCollectionId,
      name: newName,
      contentSize: content?.content.length ?? 0,
    };

    await db.transaction('rw', db.collections, db.collectionContents, db.annotations, async () => {
      await db.collections.add(newCollection);
      await db.collectionContents.add({
        id: newCollectionId,
        content: content?.content ?? [],
      });
      const annotationRepository = getAnnotationRepository();
      const annotationsToDuplicate = await annotationRepository.getByScope({
        collectionId,
      });
      const duplicatedAnnotations = annotationsToDuplicate.map((annotation) => ({
        ...annotation,
        id: uuid(),
        collectionId: newCollectionId,
      }));
      await annotationRepository.addAll(duplicatedAnnotations);
    });

    return FunctionResult.ok(newCollection);
  }

  async update(
    id: string,
    {
      name,
      about,
      tags,
      content,
      modelId,
      postLayoutModifierChainId,
      postOcrModifierChainId,
    }: {
      name: string;
      about?: string;
      tags: string[];
      content: CollectionElement[];
      modelId?: string;
      postLayoutModifierChainId?: string;
      postOcrModifierChainId?: string;
    },
  ): Promise<void> {
    await db.transaction('rw', db.collections, db.collectionContents, async () => {
      await db.collections.update(id, {
        name,
        about,
        tags,
        modelId,
        postLayoutModifierChainId,
        postOcrModifierChainId,
      });
      await db.collectionContents.update(id, {
        content,
      });
    });
  }

  async updateTags(id: string, tags: string[]): Promise<void> {
    await db.collections.update(id, {
      tags,
    });
  }

  async shiftCollectionElements(
    collectionId: string,
    sourcePosition: number,
    targetPosition: number,
  ): Promise<FunctionResult<void, EntityNotFoundError>> {
    const collectionContent = await db.collectionContents.get(collectionId);
    if (!collectionContent) {
      return FunctionResult.err(
        new EntityNotFoundError({ entity: 'Collection', id: collectionId }),
      );
    }
    const { content } = collectionContent;
    if (
      sourcePosition < 0 ||
      targetPosition < 0 ||
      sourcePosition >= content.length ||
      targetPosition >= content.length ||
      sourcePosition === targetPosition
    ) {
      return FunctionResult.err(
        new EntityNotFoundError({
          entity: 'CollectionElement',
          id: `${sourcePosition} or ${targetPosition}`,
        }),
      );
    }

    // L'ordre des éléments est porté par leur position dans le tableau, on la met à jour directement.
    const [movedElement] = content.splice(sourcePosition, 1);
    content.splice(targetPosition, 0, movedElement);

    await db.collectionContents.update(collectionId, { content });
    return FunctionResult.ok(undefined);
  }

  async addContentToCollection(collection: Collection): Promise<void> {
    const { content, ...collectionDetails } = collection;
    await db.transaction('rw', db.collections, db.collectionContents, async () => {
      await db.collections.put(collectionDetails);
      await db.collectionContents.put({
        id: collection.id,
        content: collection.content,
      });
    });
  }

  async delete(
    collectionToRemove: Collection,
  ): Promise<FunctionResult<{ workersIds: string[]; collectionId: string }, DBError>> {
    return await this.deleteById(collectionToRemove.id);
  }

  async deleteById(
    collectionId: string,
  ): Promise<FunctionResult<{ workersIds: string[]; collectionId: string }, DBError>> {
    return await FunctionResult.fromPromise(
      db.transaction(
        'rw',
        [db.collections, db.collectionContents, db.annotations, db.workers, db.results],
        async () => {
          //remove the annotations of the collection
          const annotationRepository = getAnnotationRepository();
          await annotationRepository.deleteByScope({
            collectionId,
          });
          //remove the workers associated to the collection
          const workerRepository = getWorkerRepository();
          const workersIds = await workerRepository.deleteByScope({
            collectionId,
          });
          //remove the collection
          await db.collections.delete(collectionId);
          await db.collectionContents.delete(collectionId);
          return { workersIds, collectionId };
        },
      ),
      (error) =>
        new DBError({
          message: `Failed to delete collection with id ${collectionId}: ${getErrorMessage(error)}`,
        }),
    );
  }

  async deleteMultiple(collectionsToRemoveIds: string[]): Promise<FunctionResult<void, DBError>> {
    for (const collectionId of collectionsToRemoveIds) {
      const result = await this.getById(collectionId);
      // une collection déjà absente n'est pas un échec de la suppression multiple
      if (!result.ok) {
        continue;
      }
      const deleteResult = await this.deleteById(collectionId);
      if (!deleteResult.ok) {
        return deleteResult;
      }
    }
    return FunctionResult.ok(undefined);
  }

  async deleteElement(
    collectionId: string,
    canvasId: string,
  ): Promise<FunctionResult<Collection, EntityNotFoundError>> {
    const result = await this.getById(collectionId);
    if (!result.ok) {
      return result;
    }
    const { content, ...collectionDetails } = result.value;

    const updatedContent = content.filter((elt) => elt.canvasId !== canvasId);
    const updatedDetails = { ...collectionDetails, contentSize: updatedContent.length };

    const annotationRepository = getAnnotationRepository();
    await annotationRepository.deleteByScope({
      collectionId,
      canvasId,
    });

    const updatedCollection = { ...updatedDetails, content: updatedContent };
    await this.addContentToCollection(updatedCollection);

    return FunctionResult.ok(updatedCollection);
  }
}
