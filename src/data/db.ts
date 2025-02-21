import Dexie, { type EntityTable } from 'dexie';
import { History } from './models/history';
import { List } from './models/list';

const db = new Dexie('mezanno') as Dexie & {
  lists: EntityTable<List, 'id'>;
  history: EntityTable<History, 'url'>;
};

db.version(1).stores({
  lists: '&id, name, content',
  history: '&url',
});

export { db };
