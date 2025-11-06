import { Tag } from '@/data/models/Tag';
import { db } from './db';
import { TagRepository } from './types';

export class IndexedDBTagRepository implements TagRepository {
  async getByIds(ids: string[]): Promise<Tag[]> {
    return await db.tags.where('id').anyOf(ids).toArray();
  }

  async getAll(): Promise<Tag[]> {
    return await db.tags.toArray();
  }

  async add(tag: Tag): Promise<Tag> {
    const id = await db.tags.add(tag);
    return { ...tag, id };
  }

  async addAll(tags: Tag[]): Promise<void> {
    await db.tags.bulkPut(tags);
  }
}
