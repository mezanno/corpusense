import { ConvertedFile } from '@/data/models/ConvertedFile';
import { db } from './db';
import { ConvertedFileRepository } from './types';

export class IndexedDBConvertedFileRepository implements ConvertedFileRepository {
  async add(file: ConvertedFile): Promise<void> {
    await db.convertedFiles.add(file);
  }

  async delete(id: string): Promise<void> {
    await db.convertedFiles.delete(id);
  }
}
