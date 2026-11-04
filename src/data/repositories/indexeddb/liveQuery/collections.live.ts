import { Collection, CollectionDetails } from '@/data/models/collection/collection';
import { CanvasWithSourceId } from '@/hooks/data/collections/useCollectionContent';
import { Canvas } from '@iiif/presentation-3';
import { db } from '../db';
import { getSourceRepository } from '../dbFactory';
import { CollectionLiveRepository } from './types.live';

export class IndexedDBCollectionLiveRepository implements CollectionLiveRepository {
  getAllDetails(): () => Promise<CollectionDetails[]> {
    return () => db.collections.orderBy('name').toArray();
  }

  getAllDetailsByIds(ids: string[]): () => Promise<CollectionDetails[]> {
    return () => db.collections.where('id').anyOf(ids).toArray();
  }

  getById(id: string): () => Promise<Collection | undefined> {
    return async () => {
      const details = await db.collections.get(id);
      if (details === undefined) {
        // en live query, une collection absente est un état transitoire (loading/missing),
        // pas une erreur : les consumers gardent la garde sur `undefined`.
        return undefined;
      }
      const content = await db.collectionContents.get(id);

      return { ...details, content: content?.content || [] };
    };
  }

  getCanvasesByCollectionId(collectionId: string): () => Promise<CanvasWithSourceId[]> {
    const sourceRepository = getSourceRepository();
    return async () => {
      const collectionContent = await db.collectionContents.get(collectionId);
      const content = collectionContent?.content || [];
      if (content.length === 0) {
        return [];
      }

      const canvasesWithResults = await Promise.all(
        content.map(async ({ sourceId, canvasId }) => ({
          canvasResult: await sourceRepository.getCanvasById(sourceId, canvasId),
          sourceId,
        })),
      );

      const canvases = canvasesWithResults
        .filter(
          (item): item is { canvasResult: { ok: true; value: Canvas }; sourceId: string } =>
            item.canvasResult.ok,
        )
        .map((item) => ({
          canvas: item.canvasResult.value,
          sourceId: item.sourceId,
        }));
      return canvases;
    };
  }
}
