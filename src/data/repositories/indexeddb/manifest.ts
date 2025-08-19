import { StoredItemDetails } from '@/data/models/StoredItem';
import { getErrorMessage } from '@/utils/utils';
import { Canvas, Manifest } from '@iiif/presentation-3';
import i18next from 'i18next';
import { db } from './db';
import { getStoredItemRepository } from './dbFactory';
import { ManifestRepository } from './types';

export class IndexedDBManifestRepository implements ManifestRepository {
  async exists(id: string): Promise<boolean> {
    return !!(await db.storedItems.get(id));
  }

  async getCanvasById(manifestId: string, canvasId: string): Promise<Canvas> {
    const storedItemRepository = getStoredItemRepository();
    try {
      const manifest = await storedItemRepository.getById(manifestId);
      const canvas = manifest.content.items?.find((item) => item.id === canvasId);
      if (canvas) {
        return canvas as Canvas;
      }
    } catch (error) {
      // throw new Error(i18next.t('error_canvas_not_found'));
      throw new Error(getErrorMessage(error));
    }
    throw new Error(i18next.t('error_canvas_not_found'));
  }

  async getCanvasByIds(manifestId: string, canvasIds: string[]): Promise<Canvas[]> {
    const storedItemRepository = getStoredItemRepository();
    try {
      const manifest = await storedItemRepository.getById(manifestId);
      const canvases = manifest.content.items?.filter((item) => canvasIds.includes(item.id)) as
        | Canvas[]
        | undefined;
      if (canvases && canvases?.length > 0) {
        return canvases;
      }
    } catch (error) {
      // throw new Error(i18next.t('error_canvas_not_found'));
      throw new Error(getErrorMessage(error));
    }
    throw new Error(i18next.t('error_canvas_not_found'));
  }

  async getManifestById(manifestId: string): Promise<Manifest> {
    const storedItemRepository = getStoredItemRepository();
    try {
      const manifest = await storedItemRepository.getById(manifestId);
      if (manifest !== undefined) {
        return manifest.content as Manifest;
      }
    } catch (error) {
      // throw new Error(i18next.t('error_manifest_not_found'));
      throw new Error(getErrorMessage(error));
    }
    throw new Error(i18next.t('error_manifest_not_found'));
  }

  async getManifestDetailsByIds(manifestIds: string[]): Promise<StoredItemDetails[]> {
    return await db.storedItems.where('id').anyOf(manifestIds).toArray();
  }

  async loadMetadataForManifest(manifestId: string) {
    const metadata = await db.itemMetadata.where({ id: manifestId }).toArray();
    return metadata?.map((item) => item.attribute) ?? [];
  }

  async saveManifest(manifest: Manifest) {
    const summaryNone = manifest.summary?.['none'];
    const labelNone = manifest.label?.['none'];
    const name =
      Array.isArray(summaryNone) && summaryNone[0]
        ? summaryNone[0]
        : Array.isArray(labelNone) && labelNone[0]
          ? labelNone[0]
          : '';
    const thumbnail = manifest.thumbnail?.[0];

    await db.transaction('rw', db.storedItems, db.storedItemContents, async () => {
      await db.storedItems.add({ id: manifest.id, name, thumbnail });
      await db.storedItemContents.add({ id: manifest.id, content: manifest });
    });
  }

  async getHistory() {
    return await db.history.toArray();
  }

  async addToHistory(url: string) {
    const addedHistory = { url };
    await db.history.add(addedHistory);
    return addedHistory;
  }

  async removeFromHistory(url: string) {
    await db.history.delete(url);
  }
}
