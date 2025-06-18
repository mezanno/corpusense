import { Annotation } from '@/data/models/Annotation';
import { Collection } from '@/data/models/Collection';
import { DataModel } from '@/data/models/DataModel';
import { History } from '@/data/models/History';
import { ItemMetadata } from '@/data/models/Metadata';
import { NamedEntity } from '@/data/models/NamedEntity';
import { Result } from '@/data/models/Result';
import { StoredItem } from '@/data/models/StoredItem';
import { Tag } from '@/data/models/Tag';
import { Worker } from '@/data/models/Worker';
import Dexie, { type EntityTable } from 'dexie';

const db = new Dexie('mezanno') as Dexie & {
  collections: EntityTable<Collection, 'id'>;
  history: EntityTable<History, 'url'>;
  storedItems: EntityTable<StoredItem, 'id'>;
  itemMetadata: EntityTable<ItemMetadata, 'id'>;
  tags: EntityTable<Tag, 'id'>;
  annotations: EntityTable<Annotation, 'id'>;
  models: EntityTable<DataModel, 'id'>;
  namedEntities: EntityTable<NamedEntity, 'id'>;
  results: EntityTable<Result, 'id'>;
  workers: EntityTable<Worker, 'id'>;
};

db.version(1).stores({
  collections: '&id, name, *tags.id',
  history: '&url',
  storedItems: '&id',
  typesList: '&label',
  itemMetadata: '[id+attribute.label]',
  tags: '&id',
  models: '&id',
  annotations: '&id, canvasId, collectionId, [canvasId+collectionId], order',
  namedEntities: '&id, *annotationIds, type.id',
  results: '++id, workerName, [scopeKey+workerName]',
  workers: '&id, name, status, scope',
});

export { db };
