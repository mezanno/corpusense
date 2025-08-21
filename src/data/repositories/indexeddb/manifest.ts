import { StoredManifestDetails } from '@/data/models/StoredManifest';
import { getCanvasById, getCanvasesByIds } from '@/data/utils/manifest';
import { getErrorMessage } from '@/utils/utils';
import { Canvas, Manifest } from '@iiif/presentation-3';
import i18next from 'i18next';
import { db } from './db';
import { ManifestRepository } from './types';

export class IndexedDBManifestRepository implements ManifestRepository {
  async exists(id: string): Promise<boolean> {
    return !!(await db.storedManifests.get(id));
  }

  async getCanvasById(manifestId: string, canvasId: string): Promise<Canvas> {
    try {
      const manifest = await this.getManifestById(manifestId);
      return getCanvasById(manifest, canvasId);
    } catch (error) {
      // throw new Error(i18next.t('error_canvas_not_found'));
      throw new Error(getErrorMessage(error));
    }
  }

  async getCanvasByIds(manifestId: string, canvasIds: string[]): Promise<Canvas[]> {
    try {
      const manifest = await this.getManifestById(manifestId);
      const canvases = getCanvasesByIds(manifest, canvasIds);
      if (canvases?.length > 0) {
        return canvases;
      }
    } catch (error) {
      // throw new Error(i18next.t('error_canvas_not_found'));
      throw new Error(getErrorMessage(error));
    }
    throw new Error(i18next.t('error_canvas_not_found'));
  }

  async getManifestById(manifestId: string): Promise<Manifest> {
    try {
      const manifestContent = await db.storedManifestContents.get(manifestId);
      if (!manifestContent) {
        throw new Error(i18next.t('error_manifest_not_found_storage'));
      }
      return manifestContent.content;
    } catch (error) {
      // throw new Error(i18next.t('error_manifest_not_found'));
      throw new Error(getErrorMessage(error));
    }
  }

  async getManifestDetailsByIds(manifestIds: string[]): Promise<StoredManifestDetails[]> {
    return await db.storedManifests.where('id').anyOf(manifestIds).toArray();
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

    await db.transaction('rw', db.storedManifests, db.storedManifestContents, async () => {
      await db.storedManifests.add({ id: manifest.id, name, thumbnail });
      await db.storedManifestContents.add({ id: manifest.id, content: manifest });
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
