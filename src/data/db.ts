import Dexie, { type EntityTable } from 'dexie';
import { History } from './models/history';
import { List } from './models/list';
import { StoredCanvas } from './models/storedCanvas';
import { StoredManifest } from './models/storedManifest';

const db = new Dexie('mezanno') as Dexie & {
  lists: EntityTable<List, 'id'>;
  history: EntityTable<History, 'url'>;
  storedCanvases: EntityTable<StoredCanvas, 'id'>;
  storedManifests: EntityTable<StoredManifest, 'id'>;
};

db.version(1).stores({
  lists: '&id, name, content',
  history: '&url',
  storedCanvases: '&id, content',
  storedManifests: '&id, content',
});

export { db };
