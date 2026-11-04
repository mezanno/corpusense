import { Annotation } from '@/data/models/annotations/annotation';
import { CollectionContent, CollectionDetails } from '@/data/models/collection/collection';
import { ConvertedFile } from '@/data/models/convertedFile';
import { DataModel } from '@/data/models/dataModel/dataModel';
import { FSHandle } from '@/data/models/fSHandle';
import { History } from '@/data/models/history';
import { ItemMetadata } from '@/data/models/metadata';
import { ModifierChainDTO } from '@/data/models/modifiers/Modifier';
import { NamedEntity } from '@/data/models/namedEntity';
import { Project } from '@/data/models/project';
import { Result } from '@/data/models/result/result';
import { Source, SourceContent, StoredBlob } from '@/data/models/source/source';
import { StoredManifestContent, StoredManifestDetails } from '@/data/models/storedManifest';
import { Tag } from '@/data/models/tag';
import { TaskStatus, Worker, WorkerStatus } from '@/data/models/worker/worker';
import { workerStatusOf } from '@/data/models/worker/workerStatusLaw';
import { BaseError } from '@/utils/BaseError';
import Dexie, { type EntityTable } from 'dexie';
import 'dexie-observable';

const db = new Dexie('mezanno') as Dexie & {
  collections: EntityTable<CollectionDetails, 'id'>;
  collectionContents: EntityTable<CollectionContent, 'id'>;
  history: EntityTable<History, 'url'>;
  storedManifests: EntityTable<StoredManifestDetails, 'id'>;
  storedManifestContents: EntityTable<StoredManifestContent, 'id'>;
  itemMetadata: EntityTable<ItemMetadata, 'id'>;
  tags: EntityTable<Tag, 'id'>;
  annotations: EntityTable<Annotation, 'id'>;
  annotationsTemp: EntityTable<Annotation, 'id'>;
  models: EntityTable<DataModel, 'id'>;
  namedEntities: EntityTable<NamedEntity, 'id'>;
  results: EntityTable<Result, 'id'>;
  workers: EntityTable<Worker, 'id'>;
  handles: EntityTable<FSHandle, 'id'>;
  convertedFiles: EntityTable<ConvertedFile, 'id'>;
  modifierChains: EntityTable<ModifierChainDTO, 'id'>;
  projects: EntityTable<Project, 'id'>;
  sources: EntityTable<Source, 'id'>;
  sourceContents: EntityTable<SourceContent, 'id'>;
  storedBlobs: EntityTable<StoredBlob, 'id'>;
};

db.version(30)
  .stores({
    collections: '&id, name, *tags.id',
    collectionContents: '&id',
    history: '&url',
    storedManifests: '&id, name',
    storedManifestContents: '&id',
    typesList: '&label',
    itemMetadata: '[id+attribute.label]',
    tags: '&id',
    models: '&id, name',
    //TODO: il faudrait peut-être revoir le format et ne garder IIIF que pour l'export
    annotations:
      '&id, canvasId, collectionId, [canvasId+collectionId], order, [canvasId+collectionId+type], [collectionId+type]',
    annotationsTemp:
      '&id, canvasId, collectionId, [canvasId+collectionId], order, [canvasId+collectionId+type]',
    namedEntities: '&id, *annotationIds, type.id',
    results: '++id, workerName, workerId, [scopeKey+workerName], taskId, [workerId+taskId]',
    workers: '&id, name, status, [scopeKey+name]',
    handles: '&id',
    convertedFiles: '&id, folderName',
    modifierChains: '&id, name',
    projects: '&id, name',
    sources: '&id, name, type',
    sourceContents: '&id',
    storedBlobs: '&id',
  })
  .upgrade(async () => {
    // La migration des données (storedManifests, convertedFiles → sources/sourceContents)
    // est désormais déclenchée manuellement par l'utilisateur depuis l'interface.
    // Voir : IndexedDBSourceRepository.migrateAllSources()
  });

db.version(31)
  .stores({
    collections: '&id, name, *tags.id',
    collectionContents: '&id',
    history: '&url',
    storedManifests: '&id, name',
    storedManifestContents: '&id',
    typesList: '&label',
    itemMetadata: '[id+attribute.label]',
    tags: '&id',
    models: '&id, name',
    //TODO: il faudrait peut-être revoir le format et ne garder IIIF que pour l'export
    annotations:
      '&id, canvasId, collectionId, [canvasId+collectionId], order, [canvasId+collectionId+type], [collectionId+type]',
    annotationsTemp:
      '&id, canvasId, collectionId, [canvasId+collectionId], order, [canvasId+collectionId+type]',
    namedEntities: '&id, *annotationIds, type.id',
    results: '++id, workerName, workerId, [scopeKey+workerName], taskId, [workerId+taskId]',
    workers: '&id, name, status, [scopeKey+name]',
    handles: '&id',
    convertedFiles: '&id, folderName',
    modifierChains: '&id, name',
    projects: '&id, name',
    sources: '&id, name, type',
    sourceContents: '&id',
    storedBlobs: '&id',
  })
  .upgrade(async (tx) => {
    // Le champ position de CollectionElement est supprimé : l'ordre est désormais donné par l'ordre dans le tableau content.
    // On fige ici l'ordre existant en triant sur l'ancienne valeur (potentiellement trouée) puis on retire le champ.
    await tx
      .table('collectionContents')
      .toCollection()
      .modify((collectionContent: { content: ({ position?: number } & object)[] }) => {
        collectionContent.content = [...collectionContent.content]
          .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
          .map(({ position: _position, ...rest }) => rest);
      });
  });

db.version(32)
  .stores({
    workers: '&id, name, status, [scopeKey+name]',
  })
  .upgrade(async (tx) => {
    await tx
      .table('workers')
      .toCollection()
      .modify((worker: Worker) => {
        worker.queue = worker.queue.map((task) => {
          const previousStatus = String(task.status);
          if (previousStatus === 'error') {
            return { ...task, status: TaskStatus.COMPLETED_WITH_ERRORS };
          }
          const status = Object.values(TaskStatus).find(
            (candidate) => String(candidate) === previousStatus,
          );
          if (status === undefined) {
            throw new BaseError(
              `Unknown persisted task status during migration: ${previousStatus}`,
              { context: { workerId: worker.id, taskId: task.id, status: previousStatus } },
            );
          }
          return { ...task, status };
        });

        const previousStatus = String(worker.status);
        if (previousStatus === 'unfinished' || previousStatus === 'unfinished_with_errors') {
          return;
        }
        if (previousStatus === 'error') {
          worker.status = WorkerStatus.COMPLETED_WITH_ERRORS;
          return;
        }
        if (previousStatus === 'all') {
          throw new BaseError('The UI-only worker status "all" cannot be persisted', {
            context: { workerId: worker.id },
          });
        }
        if (
          previousStatus !== 'error' &&
          previousStatus !== 'waiting' &&
          previousStatus !== 'posting' &&
          previousStatus !== 'posted' &&
          !Object.values(WorkerStatus).some((candidate) => String(candidate) === previousStatus)
        ) {
          throw new BaseError(
            `Unknown persisted worker status during migration: ${previousStatus}`,
            { context: { workerId: worker.id, status: previousStatus } },
          );
        }

        if (worker.queue.length > 0) {
          worker.status = workerStatusOf(worker.queue);
          return;
        }

        const persistedStatus = Object.values(WorkerStatus).find(
          (candidate) => String(candidate) === previousStatus,
        );
        if (
          previousStatus === 'waiting' ||
          previousStatus === 'posting' ||
          previousStatus === 'posted'
        ) {
          worker.status = WorkerStatus.INPROGRESS;
          return;
        }
        if (persistedStatus === undefined) {
          throw new BaseError(
            `Unknown persisted worker status during migration: ${previousStatus}`,
            { context: { workerId: worker.id, status: previousStatus } },
          );
        }
        worker.status = persistedStatus;
      });
  });

export const clearDatabase = async () => {
  await Dexie.delete('mezanno');
};

export { db };
