import { FSHandle } from '@/data/models/FSHandle';
import { db } from './db';
import { FSHandleRepository } from './types';

export class IndexedDBFSHandleRepository implements FSHandleRepository {
  async getAll(): Promise<FSHandle[]> {
    return await db.handles.toArray();
  }

  async put(handle: FSHandle): Promise<void> {
    await db.handles.put(handle);
  }
}
