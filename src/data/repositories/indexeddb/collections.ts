import { CollectionElement } from '@/data/models/CollectionElement';
import { Tag } from '@/data/models/Tag';
import { Canvas } from '@iiif/presentation-3';
import { groupBy, mapValues } from 'lodash';
import { Collection, CollectionDetails } from '../../models/Collection';
import { db } from './db';
import {
  getAnnotationRepository,
  getManifestRepository,
  getTagRepository,
  getWorkerRepository,
} from './dbFactory';
import { CollectionRepository } from './types';

export class IndexedDBCollectionRepository implements CollectionRepository {
  async getAllDetails(): Promise<CollectionDetails[]> {
    return await db.collections.toArray();
  }

  async getById(id: string): Promise<Collection> {
    const details = await db.collections.get(id);
    if (details === undefined) {
      throw new Error(`Collection with id ${id} not found`);
    }
    const content = await db.collectionContents.get(id);

    return { ...details, content: content?.content || [] };
  }

  async getTagsByCollectionId(collectionId: string): Promise<Tag[]> {
    const collection = await this.getById(collectionId);
    const tagIds = collection.tags;
    if (tagIds.length === 0) {
      return [];
    }
    const tagRepository = getTagRepository();
    return await tagRepository.getByIds(tagIds);
  }

  async getCanvasesByCollectionId(collectionId: string): Promise<Canvas[]> {
    const collection = await this.getById(collectionId);
    if (collection === undefined) {
      throw new Error(`Collection with id ${collectionId} not found`);
    }

    //get the list of canvases in the collection (with their manifestId)
    const canvasesByManifest = groupBy(
      collection.content.map((elt) => ({
        canvasId: elt.canvasId,
        manifestId: elt.manifestId,
      })),
      'manifestId',
    );
    //group the canvases by manifestId
    const groupedCanvasesIds = mapValues(canvasesByManifest, (value) =>
      value.map((elt) => elt.canvasId),
    );
    const manifestRepository = getManifestRepository();
    const canvases: Canvas[] = [];
    for (const manifestId in groupedCanvasesIds) {
      const canvasIds = groupedCanvasesIds[manifestId];
      if (canvasIds.length > 0) {
        const result = await manifestRepository.getCanvasesByIds(manifestId, canvasIds);
        canvases.push(...result);
      }
    }

    return canvases;
  }

  async getCanvasById(canvasId: string, collectionId: string): Promise<Canvas> {
    const collection = await this.getById(collectionId);
    if (collection === undefined) {
      throw new Error(`Collection with id ${collectionId} not found`);
    }

    const collectionElement = collection.content.find((elt) => elt.canvasId === canvasId);
    if (!collectionElement) {
      throw new Error(`Canvas with id ${canvasId} not found in collection ${collectionId}`);
    }

    return await getManifestRepository().getCanvasById(collectionElement.manifestId, canvasId);
  }

  async create(collection: Collection): Promise<void> {
    const { content, ...collectionDetails } = collection;
    await db.transaction('rw', db.collections, db.collectionContents, async () => {
      await db.collections.add(collectionDetails);
      await db.collectionContents.add({
        id: collection.id,
        content: content ?? [],
      });
    });
  }

  async update(
    id: string,
    {
      name,
      tags,
      content,
      modelId,
    }: { name: string; tags: string[]; content: CollectionElement[]; modelId?: string },
  ): Promise<void> {
    await db.transaction('rw', db.collections, db.collectionContents, async () => {
      await db.collections.update(id, {
        name,
        tags,
        modelId,
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

  async delete(collectionToRemove: Collection): Promise<void> {
    await db.transaction(
      'rw',
      [db.collections, db.collectionContents, db.annotations, db.workers, db.results],
      async () => {
        //remove the annotations of the collection
        const annotationRepository = getAnnotationRepository();
        await annotationRepository.deleteByScope({
          collectionId: collectionToRemove.id,
        });
        //remove the workers associated to the collection
        const workerRepository = getWorkerRepository();
        await workerRepository.deleteByScope({ collectionId: collectionToRemove.id });
        //remove the collection
        await db.collections.delete(collectionToRemove.id);
        await db.collectionContents.delete(collectionToRemove.id);
      },
    );
  }

  async deleteElement(collectionId: string, canvasId: string): Promise<Collection> {
    const collection = await this.getById(collectionId);
    if (collection === undefined) {
      throw new Error(`Collection with id ${collectionId} not found`);
    }
    const { content, ...collectionDetails } = collection;

    const updatedContent = content.filter((elt) => elt.canvasId !== canvasId);
    const updatedDetails = { ...collectionDetails, contentSize: updatedContent.length };

    const annotationRepository = getAnnotationRepository();
    await annotationRepository.deleteByScope({
      collectionId,
      canvasId,
    });

    const updatedCollection = { ...updatedDetails, content: updatedContent };
    await this.addContentToCollection(updatedCollection);

    return updatedCollection;
  }
}
