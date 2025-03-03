import Dexie, { type EntityTable } from 'dexie';
import { History } from './models/history';
import { List } from './models/list';
import { StoredElement } from './models/StoredElement';

const db = new Dexie('mezanno') as Dexie & {
  lists: EntityTable<List, 'id'>;
  history: EntityTable<History, 'url'>;
  storedElements: EntityTable<StoredElement, 'id'>;
};

db.version(1).stores({
  lists: '&id, name, content',
  history: '&url',
  storedElements: '&id, content',
});

export { db };
