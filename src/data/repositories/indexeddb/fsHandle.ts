import { FSHandle } from '@/data/models/FSHandle';
import { db } from './db';
import { FSHandleRepository } from './types';

export class IndexedDBFSHandleRepository implements FSHandleRepository {
  async getById(id: string): Promise<FSHandle> {
    const handle = await db.handles.get(id);
    if (handle === undefined) {
      throw new Error('Method not implemented.');
    }
    return handle;
  }

  async put(handle: FSHandle): Promise<void> {
    await db.handles.put(handle);
  }
}
