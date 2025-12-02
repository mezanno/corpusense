import { Collection, CollectionDetails } from '@/data/models/Collection';
import { Canvas } from '@iiif/presentation-3';
import { groupBy, mapValues } from 'lodash';
import { db } from '../db';
import { getManifestRepository } from '../dbFactory';
import { CollectionLiveRepository } from './types.live';

export class IndexedDBCollectionLiveRepository implements CollectionLiveRepository {
  getAllDetails(): () => Promise<CollectionDetails[]> {
    return () => db.collections.toArray();
  }

  getById(id: string): () => Promise<Collection> {
    return async () => {
      const details = await db.collections.get(id);
      if (details === undefined) {
        throw new Error(`Collection with id ${id} not found`);
      }
      const content = await db.collectionContents.get(id);

      return { ...details, content: content?.content || [] };
    };
  }

  getCanvasesByCollectionId(collectionId: string): () => Promise<Canvas[]> {
    const manifestRepository = getManifestRepository();
    return async () => {
      const collectionContent = await db.collectionContents.get(collectionId);
      const content = collectionContent?.content || [];
      if (content.length === 0) {
        return [];
      }

      //get the list of canvases in the collection (with their manifestId)
      const canvasesByManifest = groupBy(
        content.map((elt) => ({
          canvasId: elt.canvasId,
          manifestId: elt.manifestId,
        })),
        'manifestId',
      );
      //group the canvases by manifestId
      const groupedCanvasesIds = mapValues(canvasesByManifest, (value) =>
        value.map((elt) => elt.canvasId),
      );

      const canvases: Canvas[] = [];
      for (const manifestId in groupedCanvasesIds) {
        const canvasIds = groupedCanvasesIds[manifestId];
        if (canvasIds.length > 0) {
          const result = await manifestRepository.getCanvasesByIds(manifestId, canvasIds);
          canvases.push(...result);
        }
      }

      return canvases;
    };
  }
}
