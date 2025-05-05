import { Tag } from '@/data/models/Tag';
import { db } from './db';

export class IndexedDBTagRepository {
  async getTagsByIds(ids: string[]): Promise<Tag[]> {
    return await db.tags.where('id').anyOf(ids).toArray();
  }

  async getAllTags(): Promise<Tag[]> {
    return await db.tags.toArray();
  }

  async createTag(tag: Tag): Promise<Tag> {
    const id = await db.tags.add(tag);
    return { ...tag, id };
  }

  async saveTags(tags: Tag[]): Promise<void> {
    await db.tags.bulkPut(tags);
  }
}
