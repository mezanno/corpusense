import {
  Source,
  SourceContent,
  SourceWithContent,
  SourceWithContentAndThumbnail,
  StoredBlob,
} from '@/data/models/source/source';
import { AddSourceDTO } from '@/data/models/source/source.dto';
import { DBError } from '@/data/utils/errors';
import { extractCanvasById, getThumbnailBlob } from '@/data/utils/manifest';
import { FunctionResult } from '@/utils/functionResult';
import { base64ToBlob, blobToBase64 } from '@/utils/images';
import {
  getManifestFromConvertedFile,
  reconstructManifestFromConvertedFile,
} from '@/utils/manifest';
import { NotFoundError } from '@/utils/NotFoundError';
import { getErrorMessage } from '@/utils/utils';
import { Canvas } from '@iiif/presentation-3';
import { v4 as uuid } from 'uuid';
import { EntityNotFoundError } from '../EntityNotFoundError';
import { db } from './db';
import { SourceRepository } from './types';

export class IndexedDBSourceRepository implements SourceRepository {
  async add(dto: AddSourceDTO): Promise<FunctionResult<SourceWithContent, DBError>> {
    const sourceId = uuid();
    const thumbnailBlobId = uuid();
    const newSource = {
      id: sourceId,
      name: dto.name,
      type: dto.type,
      pageCount: dto.pageCount,
      thumbnailBlobId,
    };
    const sourceContent: SourceContent =
      dto.type === 'local'
        ? {
            id: sourceId,
            type: 'local',
            manifest: dto.manifest,
            localFile: {
              ...dto.localFile,
            },
          }
        : {
            id: sourceId,
            type: 'remote',
            manifest: dto.manifest,
          };
    try {
      await db.transaction('rw', db.storedBlobs, db.sources, db.sourceContents, async () => {
        await db.storedBlobs.add({
          id: thumbnailBlobId,
          blob: dto.thumbnailBlob,
        });
        await db.sources.add(newSource);
        await db.sourceContents.add(sourceContent);
      });

      return FunctionResult.ok({
        ...newSource,
        content: sourceContent,
      });
    } catch (error) {
      return FunctionResult.err(new DBError({ message: 'Failed to add source to IndexedDB' }));
    }
  }

  async addSourceWithContentAndThumbnail(
    source: SourceWithContentAndThumbnail,
  ): Promise<FunctionResult<boolean, DBError>> {
    const { content, thumbnailBase64, ...sourceWithoutContent } = source;
    const thumbnailBlobResult = base64ToBlob(thumbnailBase64);
    try {
      await db.transaction('rw', db.sources, db.sourceContents, db.storedBlobs, async () => {
        await db.sources.add(sourceWithoutContent);
        await db.sourceContents.add(content);
        if (thumbnailBlobResult.ok) {
          await db.storedBlobs.add({
            id: sourceWithoutContent.thumbnailBlobId,
            blob: thumbnailBlobResult.value,
          });
        }
      });

      return FunctionResult.ok(true);
    } catch (error) {
      return FunctionResult.err(
        new DBError({
          message: getErrorMessage(error) || 'Failed to add source with content to IndexedDB',
        }),
      );
    }
  }

  async getBlob(blobId: string): Promise<FunctionResult<StoredBlob, EntityNotFoundError>> {
    const storedBlob = await db.storedBlobs.get(blobId);
    if (!storedBlob) {
      return FunctionResult.err(new EntityNotFoundError({ entity: 'Blob', id: blobId }));
    }
    return FunctionResult.ok(storedBlob);
  }

  async getById(sourceId: string): Promise<FunctionResult<Source, EntityNotFoundError>> {
    const source = await db.sources.get(sourceId);
    if (!source) {
      return FunctionResult.err(new EntityNotFoundError({ entity: 'Source', id: sourceId }));
    }
    return FunctionResult.ok(source);
  }

  async getContentById(
    sourceId: string,
  ): Promise<FunctionResult<SourceContent, EntityNotFoundError>> {
    const content = await db.sourceContents.get(sourceId);
    if (!content) {
      return FunctionResult.err(new EntityNotFoundError({ entity: 'SourceContent', id: sourceId }));
    }
    return FunctionResult.ok(content);
  }

  async getSourceWithContentById(
    sourceId: string,
  ): Promise<FunctionResult<SourceWithContent, EntityNotFoundError>> {
    const sourceResult = await this.getById(sourceId);
    if (!sourceResult.ok) {
      return sourceResult;
    }
    const contentResult = await this.getContentById(sourceId);
    if (!contentResult.ok) {
      return contentResult;
    }
    return FunctionResult.ok({
      ...sourceResult.value,
      content: contentResult.value,
    });
  }

  async getSourceWithContentAndThumbnailById(
    sourceId: string,
  ): Promise<FunctionResult<SourceWithContentAndThumbnail, EntityNotFoundError>> {
    const sourceWithContentResult = await this.getSourceWithContentById(sourceId);
    if (!sourceWithContentResult.ok) {
      return sourceWithContentResult;
    }
    const storedBlobResult = await this.getBlob(sourceWithContentResult.value.thumbnailBlobId);
    if (!storedBlobResult.ok) {
      return storedBlobResult;
    }
    const thumbnailBase64 = await blobToBase64(storedBlobResult.value.blob);
    return FunctionResult.ok({
      ...sourceWithContentResult.value,
      thumbnailBase64,
    });
  }

  async getContentByManifestUrl(
    manifestUrl: string,
  ): Promise<FunctionResult<SourceContent, EntityNotFoundError>> {
    const content = (await db.sourceContents.toArray()).find((c) => c.manifest.id === manifestUrl);
    if (!content) {
      return FunctionResult.err(
        new EntityNotFoundError({ entity: 'SourceContent', id: manifestUrl }),
      );
    }
    return FunctionResult.ok(content);
  }

  async getCanvasById(
    sourceId: string,
    canvasId: string,
  ): Promise<FunctionResult<Canvas, EntityNotFoundError>> {
    const contentResult = await this.getContentById(sourceId);
    if (!contentResult.ok) {
      return contentResult;
    }
    try {
      const canvas = extractCanvasById(contentResult.value.manifest, canvasId);
      return FunctionResult.ok(canvas);
    } catch {
      return FunctionResult.err(new EntityNotFoundError({ entity: 'Canvas', id: canvasId }));
    }
  }

  async updateName(sourceId: string, name: string): Promise<void> {
    await db.sources.update(sourceId, { name });
  }

  async update(
    id: string,
    changes: Partial<Omit<Source, 'thumbnailBlob' | 'outputDirectoryHandle'>> & {
      githubManifestUrl?: string;
    },
  ): Promise<void> {
    const { githubManifestUrl, ...sourceChanges } = changes;
    if (Object.keys(sourceChanges).length > 0) {
      await db.sources.update(id, sourceChanges);
    }
    if (githubManifestUrl !== undefined) {
      await db.sourceContents
        .where(':id')
        .equals(id)
        .modify((obj) => {
          if (obj.type === 'local') {
            obj.githubManifestUrl = githubManifestUrl;
          }
        });
    }
  }

  async deleteById(sourceId: string): Promise<FunctionResult<void, NotFoundError>> {
    return await db.transaction('rw', db.storedBlobs, db.sources, db.sourceContents, async () => {
      const source = await db.sources.get(sourceId);
      if (!source) {
        return FunctionResult.err(new NotFoundError({ entity: 'Source', id: sourceId }));
      }
      await db.storedBlobs.delete(source.thumbnailBlobId);
      await db.sources.delete(sourceId);
      await db.sourceContents.delete(sourceId);
      return FunctionResult.ok(undefined);
    });
  }

  async deleteAll(): Promise<void> {
    await db.transaction('rw', db.storedBlobs, db.sources, db.sourceContents, async () => {
      const sources = await db.sources.toArray();
      const thumbnailBlobIds = sources.map((source) => source.thumbnailBlobId);
      await db.storedBlobs.bulkDelete(thumbnailBlobIds);
      await db.sources.clear();
      await db.sourceContents.clear();
    });
  }

  /**
   * Returns the total number of entries still present in the legacy tables
   * (storedManifests + convertedFiles) that have not yet been migrated to
   * the new sources/sourceContents schema.
   */
  async getPendingMigrationCount(): Promise<number> {
    const [manifests, files, existingContents] = await Promise.all([
      db.storedManifests.toArray(),
      db.convertedFiles.toArray(),
      db.sourceContents.toArray(),
    ]);

    // Build the set of manifest ids already present in sourceContents.
    const migratedManifestIds = new Set(existingContents.map((c) => c.manifest.id));

    // storedManifests.id is the manifest URL → already migrated if found in sourceContents.
    const pendingManifests = manifests.filter((m) => !migratedManifestIds.has(m.id)).length;

    const sourceContentsIds = new Set(existingContents.map((c) => c.id));
    const pendingFiles = files.filter((f) => !sourceContentsIds.has(f.id)).length;

    return pendingManifests + pendingFiles;
  }

  /**
   * Migrates all legacy data (storedManifests + convertedFiles) to the new
   * sources/sourceContents schema, then updates collection references and
   * clears the legacy tables.
   * This method is intended to be called on explicit user action.
   */
  async migrateAllSources(): Promise<void> {
    const storedManifests = await db.storedManifests.toArray();
    const storedManifestContents = await db.storedManifestContents.toArray();
    const convertedFiles = await db.convertedFiles.toArray();

    // Build an id mapping to update collection references after migration
    const manifestIdMap = new Map<string, string>();

    // ----------------------------
    // 🔁 Remote manifests (storedManifests → sources)
    // ----------------------------
    for (const manifest of storedManifests) {
      const content = storedManifestContents.find((c) => c.id === manifest.id);
      if (content === undefined) {
        console.warn(`No content found for manifest ${manifest.id}, skipping.`);
        continue;
      }

      const sourceId = uuid();
      const thumbnailBlobId = uuid();

      let thumbnailBlob = new Blob();
      try {
        thumbnailBlob = await getThumbnailBlob(content.content);
      } catch {
        console.warn(`Could not fetch thumbnail for manifest ${manifest.id}.`);
      }

      try {
        await db.transaction('rw', db.storedBlobs, db.sources, db.sourceContents, async () => {
          await db.storedBlobs.add({ id: thumbnailBlobId, blob: thumbnailBlob });
          await db.sources.add({
            id: sourceId,
            name: manifest.name,
            type: 'remote',
            pageCount: content.content?.items?.length ?? 0,
            thumbnailBlobId,
          });
          await db.sourceContents.add({
            id: sourceId,
            type: 'remote',
            manifest: content.content,
          });
        });
        manifestIdMap.set(manifest.id, sourceId);
      } catch (error) {
        console.error(`Error migrating manifest ${manifest.id}:`, error);
      }
    }

    // ----------------------------
    // 🔁 Local files (convertedFiles → sources)
    // ----------------------------
    for (const file of convertedFiles) {
      const thumbnailBlobId = uuid();

      try {
        // Try to read the real manifest from disk; fall back to reconstruction
        const manifest =
          (await getManifestFromConvertedFile(file)) ?? reconstructManifestFromConvertedFile(file);

        await db.transaction('rw', db.storedBlobs, db.sources, db.sourceContents, async () => {
          await db.storedBlobs.add({ id: thumbnailBlobId, blob: file.thumbnailBlob });
          await db.sources.add({
            id: file.id,
            name: file.title,
            type: 'local',
            pageCount: file.pageCount,
            thumbnailBlobId,
          });
          await db.sourceContents.add({
            id: file.id,
            type: 'local',
            manifest,
            localFile: {
              outputDirectoryHandle: file.outputDirectoryHandle,
              timestamp: file.timestamp,
              manifestName: file.manifestName,
              folderName: file.folderName,
            },
          } as SourceContent);
        });
        manifestIdMap.set(file.id, file.id);
      } catch (error) {
        console.error(`Error migrating converted file ${file.id}:`, error);
      }
    }

    // ----------------------------
    // 🔁 Update collection references (manifestId → sourceId)
    // ----------------------------
    console.log('manifestIdMap: ', manifestIdMap);

    await db.collectionContents.toCollection().modify((collection) => {
      for (const element of collection.content) {
        const oldId = element.manifestId;
        if (oldId !== undefined) {
          const newId = manifestIdMap.get(oldId);
          if (newId !== undefined && newId !== '') {
            element.sourceId = newId;
          } else if (element.sourceId === undefined || element.sourceId === '') {
            element.sourceId = oldId;
          }
        }
      }
    });

    // ----------------------------
    // 🧹 Clear legacy tables
    // ----------------------------
    // await db.storedManifests.clear();
    // await db.storedManifestContents.clear();
    // await db.convertedFiles.clear();
  }
}
