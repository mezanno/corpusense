import { ConvertedFile } from '@/data/models/ConvertedFile';
import { db } from './db';
import { ConvertedFileRepository } from './types';

export class IndexedDBConvertedFileRepository implements ConvertedFileRepository {
  async getById(id: string): Promise<ConvertedFile> {
    const file = await db.convertedFiles.get(id);
    if (!file) {
      throw new Error(`ConvertedFile with id ${id} not found`);
    }
    return file;
  }

  async add(file: ConvertedFile): Promise<void> {
    await db.convertedFiles.add(file);
  }

  async delete(id: string): Promise<void> {
    await db.convertedFiles.delete(id);
  }
}
