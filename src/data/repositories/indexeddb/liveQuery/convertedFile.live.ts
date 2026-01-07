import { ConvertedFile } from '@/data/models/ConvertedFile';
import { db } from '../db';
import { ConvertedFileLiveRepository } from './types.live';

export class IndexedDBConvertedFileLiveRepository implements ConvertedFileLiveRepository {
  getAll(): () => Promise<ConvertedFile[]> {
    return () => db.convertedFiles.toArray();
  }
}
