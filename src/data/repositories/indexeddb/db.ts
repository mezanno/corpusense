import { Annotation } from '@/data/models/Annotation';
import { CollectionContent, CollectionDetails } from '@/data/models/Collection';
import { ConvertedFile } from '@/data/models/ConvertedFile';
import { DataModel } from '@/data/models/DataModel';
import { FSHandle } from '@/data/models/FSHandle';
import { History } from '@/data/models/History';
import { ItemMetadata } from '@/data/models/Metadata';
import { NamedEntity } from '@/data/models/NamedEntity';
import { Result } from '@/data/models/Result';
import { StoredManifestContent, StoredManifestDetails } from '@/data/models/StoredManifest';
import { Tag } from '@/data/models/Tag';
import { Worker } from '@/data/models/Worker';
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
  models: EntityTable<DataModel, 'id'>;
  namedEntities: EntityTable<NamedEntity, 'id'>;
  results: EntityTable<Result, 'id'>;
  workers: EntityTable<Worker, 'id'>;
  handles: EntityTable<FSHandle, 'id'>;
  convertedFiles: EntityTable<ConvertedFile, 'id'>;
};

db.version(1).stores({
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
    '&id, canvasId, collectionId, [canvasId+collectionId], order, [canvasId+collectionId+type]',
  namedEntities: '&id, *annotationIds, type.id',
  results: '++id, workerName, workerId, [scopeKey+workerName], taskId',
  workers: '&id, name, status, [scopeKey+name]',
  handles: '&id',
  convertedFiles: '&id, folderName',
});

export const clearDatabase = async () => {
  await Dexie.delete('mezanno');
};

Dexie.debug = true;

// db.version(33)
//   .stores({
//     collections: '&id, name, *tags.id',
//     collectionContents: 'id',
//     history: '&url',
//     storedItems: '&id',
//     typesList: '&label',
//     itemMetadata: '[id+attribute.label]',
//     tags: '&id',
//     models: '&id, name',
//     annotations: '&id, canvasId, collectionId, [canvasId+collectionId], order',
//     namedEntities: '&id, *annotationIds, type.id',
//     results: '++id, workerName, workerId, [scopeKey+workerName], taskId',
//     workers: '&id, name, status, [scopeKey+name]',
//   })
//   .upgrade(async (tx) => {
//     // Exemple : si tu veux initialiser collectionContents pour chaque collection
//     const collections = (await tx.table('collections').toArray()) as Collection[];
//     for (const col of collections) {
//       await tx.table('collectionContents').put({
//         id: col.id,
//         content: col.content,
//       });
//       await tx.table('collections').put({
//         id: col.id,
//         name: col.name,
//         about: col.about,
//         tags: col.tags,
//         modelId: col.modelId,
//       });
//     }
//   });

// db.version(35).upgrade(async (tx) => {
//   const content = (await tx.table('collectionContents').toArray()) as CollectionContent[];
//   const collections = (await tx.table('collections').toArray()) as Collection[];
//   for (const col of collections) {
//     await tx.table('collections').put({
//       id: col.id,
//       name: col.name,
//       about: col.about,
//       tags: col.tags,
//       modelId: col.modelId,
//       contentSize: content.find((c) => c.id === col.id)?.content.length,
//     });
//   }
// });

// db.version(36)
//   .stores({
//     collections: '&id, name, *tags.id',
//     collectionContents: 'id',
//     history: '&url',
//     storedItems: '&id, name',
//     storedItemContents: 'id',
//     typesList: '&label',
//     itemMetadata: '[id+attribute.label]',
//     tags: '&id',
//     models: '&id, name',
//     annotations: '&id, canvasId, collectionId, [canvasId+collectionId], order',
//     namedEntities: '&id, *annotationIds, type.id',
//     results: '++id, workerName, workerId, [scopeKey+workerName], taskId',
//     workers: '&id, name, status, [scopeKey+name]',
//   })
//   .upgrade(async (tx) => {
//     // Exemple : si tu veux initialiser collectionContents pour chaque collection
//     const storedItems = (await tx.table('storedItems').toArray()) as StoredItem[];
//     for (const item of storedItems) {
//       await tx.table('storedItemContents').put({
//         id: item.id,
//         content: item.content,
//       });
//       await tx.table('storedItems').put({
//         id: item.id,
//         name: item.content.label?.['none']?.[0],
//       });
//     }
//   });

export { db };
