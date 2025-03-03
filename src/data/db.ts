import Dexie, { type EntityTable } from 'dexie';
import { History } from './models/history';
import { List } from './models/list';
import { ListElement } from './models/listElement';
import { StoredElement } from './models/StoredElement';

const db = new Dexie('mezanno') as Dexie & {
  lists: EntityTable<List, 'id'>;
  history: EntityTable<History, 'url'>;
  storedElements: EntityTable<StoredElement, 'id'>;
  listElements: EntityTable<ListElement, 'id'>;
};

db.version(1).stores({
  lists: '&id, name',
  history: '&url',
  storedElements: '&id',
  listElements: '++id, canvasId, listId',
});

export { db };
