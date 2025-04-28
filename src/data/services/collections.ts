import { Canvas } from '@iiif/presentation-3';
import { db } from '../db';
import { Collection } from '../models/Collection';
import { SelectedCanvas } from '../models/SelectedCanvas';

const getCollectionById = async (id: string) => {
  const result = await db.collections.get(id);
  if (result === undefined) {
    throw new Error(`Collection with id ${id} not found`);
  }
  return result;
};

const getCanvasesByCollectionId = async (collectionId: string): Promise<Canvas[]> => {
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
};

const saveCollectionContent = async (collection: Collection, selection: SelectedCanvas[]) => {
  await db.transaction('rw', db.storedItems, db.collections, async () => {
    const canvasesToStore = selection.map((elt) => ({
      id: elt.canvas.id,
      content: elt.canvas,
    }));
    //on utilie bulkPut pour éviter les doublons et éviter une erreur si un doublon existe (avec bulkAdd, une erreur est levée au premier doublon rencontré)
    await db.storedItems.bulkPut(canvasesToStore);
    await db.collections.put(collection);
  });
};

function generateCollectionContent(
  position: number,
  selection: SelectedCanvas[],
  collectionId: string,
  manifestId: string,
  existingCanvasIds: string[] = [],
) {
  return selection
    .map((elt) =>
      existingCanvasIds.includes(elt.canvas.id)
        ? null
        : {
            canvasId: elt.canvas.id,
            collectionId,
            position: ++position,
            manifestId,
          },
    )
    .filter((elt) => elt !== null);
}

export {
  generateCollectionContent,
  getCanvasesByCollectionId,
  getCollectionById,
  saveCollectionContent,
};
