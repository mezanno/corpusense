import { StoredManifestDetails } from '@/data/models/StoredManifest';
import {
  extractCanvasById,
  extractCanvasesByIds,
  extractManifestDetails,
} from '@/data/utils/manifest';
import { getErrorMessage } from '@/utils/utils';
import { Canvas, Manifest } from '@iiif/presentation-3';
import i18next from 'i18next';
import { db } from './db';
import { ManifestRepository } from './types';

export class IndexedDBManifestRepository implements ManifestRepository {
  // async exists(id: string): Promise<boolean> {
  //   return !!(await db.storedManifests.get(id));
  // }

  async getCanvasById(manifestId: string, canvasId: string): Promise<Canvas> {
    try {
      const manifest = await this.getById(manifestId);
      return extractCanvasById(manifest, canvasId);
    } catch (error) {
      // throw new Error(i18next.t('error_canvas_not_found'));
      throw new Error(getErrorMessage(error));
    }
  }

  async getCanvasesByIds(manifestId: string, canvasIds: string[]): Promise<Canvas[]> {
    try {
      const manifest = await this.getById(manifestId);
      const canvases = extractCanvasesByIds(manifest, canvasIds);
      if (canvases?.length > 0) {
        return canvases;
      }
    } catch (error) {
      // throw new Error(i18next.t('error_canvas_not_found'));
      throw new Error(getErrorMessage(error));
    }
    throw new Error(i18next.t('error_canvas_not_found'));
  }

  async getById(manifestId: string): Promise<Manifest> {
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

  async getDetailsByManifestIds(manifestIds: string[]): Promise<StoredManifestDetails[]> {
    return await db.storedManifests.where('id').anyOf(manifestIds).toArray();
  }

  async getMetadata(manifestId: string) {
    const metadata = await db.itemMetadata.where({ id: manifestId }).toArray();
    return metadata?.map((item) => item.attribute) ?? [];
  }

  async add(manifest: Manifest) {
    const { name, thumbnail } = extractManifestDetails(manifest);

    await db.transaction('rw', db.storedManifests, db.storedManifestContents, async () => {
      await db.storedManifests.add({ id: manifest.id, name, thumbnail });
      await db.storedManifestContents.add({ id: manifest.id, content: manifest });
    });
  }

  async getHistoryEntries() {
    return await db.history.toArray();
  }

  async addToHistory(url: string) {
    const addedHistory = { url };
    await db.history.add(addedHistory);
    return addedHistory;
  }

  async deleteFromHistory(url: string) {
    await db.history.delete(url);
  }
}
