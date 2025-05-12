import { Canvas, Manifest } from '@iiif/presentation-3';
import i18next from 'i18next';
import { db } from './db';
import { ManifestRepository } from './types';

export class IndexedDBManifestRepository implements ManifestRepository {
  async exists(id: string): Promise<boolean> {
    return !!(await db.storedItems.get(id));
  }

  async getCanvases(manifestId: string, canvasId: string): Promise<Canvas> {
    const manfiest = await db.storedItems.get(manifestId);
    if (manfiest) {
      const canvas = manfiest.content.items?.find((item) => item.id === canvasId);
      if (canvas) {
        return canvas as Canvas;
      }
    }
    throw new Error(i18next.t('error_canvas_not_found'));
  }

  async getManifest(manifestId: string): Promise<Manifest> {
    const manifest = await db.storedItems.get(manifestId);
    if (manifest !== undefined) {
      return manifest.content as Manifest;
    }
    throw new Error(i18next.t('error_manifest_not_found'));
  }

  async loadMetadataForManifest(manifestId: string) {
    const metadata = await db.itemMetadata.where({ id: manifestId }).toArray();
    return metadata?.map((item) => item.attribute) ?? [];
  }

  async saveManifest(manifest: Manifest) {
    try {
      await db.storedItems.add({ id: manifest.id, content: manifest });
    } catch (error) {
      console.warn('Error saving manifest to indexedDB', error);
    }
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
