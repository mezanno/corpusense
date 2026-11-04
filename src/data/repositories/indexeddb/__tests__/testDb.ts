import 'fake-indexeddb/auto';
import { db } from '../db';

export async function createTestDb() {
  db.close();
  await db.delete();
  await db.open();
  return db;
}
