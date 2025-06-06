import { Result } from '@/data/models/Result';
import { db } from './db';
import { ResultRepository } from './types';

export class IndexedDBResultRepository implements ResultRepository {
  async addResult(result: Result): Promise<void> {
    console.log('Saving result:', result);
    await db.results.add(result);
  }
}
