import Dexie, { type EntityTable } from 'dexie';
import { List } from './models/list';

const db = new Dexie('mezanno') as Dexie & {
  lists: EntityTable<List, 'id'>;
};

db.version(1).stores({
  lists: '&id, name, content',
});

export { db };
