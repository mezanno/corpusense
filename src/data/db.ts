import Dexie, { type EntityTable } from 'dexie';
import { Annotation } from './models/Annotation';
import { Collection } from './models/Collection';
import { History } from './models/History';
import { ItemMetadata } from './models/Metadata';
import { StoredItem } from './models/StoredItem';
import { Tag } from './models/Tag';

const db = new Dexie('mezanno') as Dexie & {
  collections: EntityTable<Collection, 'id'>;
  history: EntityTable<History, 'url'>;
  storedItems: EntityTable<StoredItem, 'id'>;
  itemMetadata: EntityTable<ItemMetadata, 'id'>;
  tags: EntityTable<Tag, 'id'>;
  annotations: EntityTable<Annotation, 'id'>;
};

db.version(1).stores({
  collections: '&id, name, *tags.id',
  history: '&url',
  storedItems: '&id',
  typesList: '&label',
  itemMetadata: '[id+attribute.label]',
  tags: '&id',
  annotations: '&id, canvasId',
});

export { db };
