import Dexie, { type EntityTable } from 'dexie';
import { Annotation } from './models/Annotation';
import { History } from './models/History';
import { List } from './models/List';
import { ItemMetadata } from './models/Metadata';
import { StoredItem } from './models/StoredItem';
import { Tag } from './models/Tag';

const db = new Dexie('mezanno') as Dexie & {
  lists: EntityTable<List, 'id'>;
  history: EntityTable<History, 'url'>;
  storedItems: EntityTable<StoredItem, 'id'>;
  // listElements: EntityTable<ListElement, 'id'>;
  itemMetadata: EntityTable<ItemMetadata, 'id'>;
  tags: EntityTable<Tag, 'id'>;
  annotations: EntityTable<Annotation, 'id'>;
};

db.version(1).stores({
  lists: '&id, name, *tags.id',
  history: '&url',
  storedItems: '&id',
  // listElements: '++id, canvasId, listId, [listId+canvasId]',
  typesList: '&label',
  itemMetadata: '[id+attribute.label]',
  tags: '&id',
  annotations: '&id, canvasId',
});

export { db };
