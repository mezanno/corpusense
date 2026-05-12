import { ConvertedFile } from '@/data/models/ConvertedFile';
import { t } from 'i18next';
import { db } from './db';
import { ConvertedFileRepository } from './types';

export class IndexedDBConvertedFileRepository implements ConvertedFileRepository {
  async getById(id: string): Promise<ConvertedFile> {
    const file = await db.convertedFiles.get(id);
    if (!file) {
      throw new Error(t('error_fsfile_not_found', { id: id }));
    }
    return file;
  }

  async getByFolderName(folderName: string): Promise<ConvertedFile> {
    const file = await db.convertedFiles.where('folderName').equals(folderName).first();
    if (!file) {
      throw new Error(t('error_fsfolder_not_found', { name: folderName }));
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
