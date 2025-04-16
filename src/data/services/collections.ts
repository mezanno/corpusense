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

const saveCollection = async (collection: Collection, selection: SelectedCanvas[]) => {
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

export { getCollectionById, saveCollection };
