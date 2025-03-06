import Dexie, { type EntityTable } from 'dexie';
import { History } from './models/History';
import { List } from './models/List';
import { ListElement } from './models/ListElement';
import { ItemMetadata } from './models/Metadata';
import { StoredItem } from './models/StoredItem';
import { Tag } from './models/Tag';

const db = new Dexie('mezanno') as Dexie & {
  lists: EntityTable<List, 'id'>;
  history: EntityTable<History, 'url'>;
  storedItems: EntityTable<StoredItem, 'id'>;
  listElements: EntityTable<ListElement, 'id'>;
  itemMetadata: EntityTable<ItemMetadata, 'id'>;
  tags: EntityTable<Tag, 'id'>;
};

db.version(1).stores({
  lists: '&id, name, *tags.id',
  history: '&url',
  storedItems: '&id',
  listElements: '++id, canvasId, listId',
  typesList: '&label',
  itemMetadata: '&id',
  tags: '&id',
});

export { db };
