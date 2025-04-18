import { db } from '../db';

const getTagsByIds = async (ids: string[]) => {
  return await db.tags.where('id').anyOf(ids).toArray();
};

export { getTagsByIds };
