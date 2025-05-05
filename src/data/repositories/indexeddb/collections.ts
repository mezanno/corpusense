import { CollectionElement } from '@/data/models/CollectionElement';
import { Canvas } from '@iiif/presentation-3';
import { Collection } from '../../models/Collection';
import { SelectedCanvas } from '../../models/SelectedCanvas';
import { db } from './db';
import { CollectionRepository } from './types';

export class IndexedDBCollectionRepository implements CollectionRepository {
  async getAll(): Promise<Collection[]> {
    return await db.collections.toArray();
  }

  async getCollectionById(id: string): Promise<Collection> {
    const result = await db.collections.get(id);
    if (result === undefined) {
      throw new Error(`Collection with id ${id} not found`);
    }
    return result;
  }

  async getCanvasesByCollectionId(collectionId: string): Promise<Canvas[]> {
    const collection = await db.collections.get(collectionId);
    if (collection === undefined) {
      throw new Error(`Collection with id ${collectionId} not found`);
    }
    const canvasesIds = collection.content.map((elt) => elt.canvasId);
    const items = await db.storedItems.bulkGet(canvasesIds);

    if (items === undefined || items.length === 0) {
      return [];
    }

    return items
      .map((item) => item?.content as Canvas)
      .filter((canvas): canvas is Canvas => canvas !== undefined);
  }

  async insertCollection(collection: Collection): Promise<void> {
    await db.collections.add(collection);
  }

  async update(
    id: string,
    { name, tags, content }: { name: string; tags: string[]; content: CollectionElement[] },
  ): Promise<void> {
    await db.collections.update(id, {
      name,
      tags,
      content,
    });
  }

  async updateTags(id: string, tags: string[]): Promise<void> {
    await db.collections.update(id, {
      tags,
    });
  }

  async saveCollectionContent(collection: Collection, selection: SelectedCanvas[]): Promise<void> {
    await db.transaction('rw', db.storedItems, db.collections, async () => {
      const canvasesToStore = selection.map((elt) => ({
        id: elt.canvas.id,
        content: elt.canvas,
      }));
      //on utilie bulkPut pour éviter les doublons et éviter une erreur si un doublon existe (avec bulkAdd, une erreur est levée au premier doublon rencontré)
      await db.storedItems.bulkPut(canvasesToStore);
      await db.collections.put(collection);
    });
  }

  async remove(collectionToRemove: Collection): Promise<void> {
    await db.transaction('rw', db.collections, db.storedItems, async () => {
      //list the canvases to remove (to remove them from the storedItems)
      const canvasIds = collectionToRemove.content.map((elt) => elt.canvasId);
      await db.storedItems.bulkDelete(canvasIds);
      //remove the annotations related to the canvases (for this collection)
      //TODO!
      //remove the collection
      await db.collections.delete(collectionToRemove.id);
    });
  }

  async removeElement(collectionId: string, canvasId: string): Promise<Collection> {
    const collection = await this.getCollectionById(collectionId);
    if (collection === undefined) {
      throw new Error(`Collection with id ${collectionId} not found`);
    }
    await db.transaction('rw', db.storedItems, db.collections, async () => {
      //update the content of the collection
      const savedElements = collection.content?.filter((elt) => elt.canvasId !== canvasId);
      collection.content = savedElements;
      await db.collections.put(collection);
      //and remove the canvas from the storedItems
      await db.storedItems.delete(canvasId);
    });
    return collection;
  }
}
