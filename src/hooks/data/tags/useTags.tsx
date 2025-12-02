import { Tag } from '@/data/models/Tag';
import { getTagLiveRepository, getTagRepository } from '@/data/repositories/indexeddb/dbFactory';
import { useLiveQuery } from 'dexie-react-hooks';
import { useCallback, useMemo } from 'react';

export const useTags = () => {
  const tagLiveRepository = useMemo(getTagLiveRepository, []);
  const tagRepository = useMemo(getTagRepository, []);

  const tags = useLiveQuery(tagLiveRepository.getAll(), [tagLiveRepository], [] as Tag[]);

  const getTagsByIds = useCallback(
    (ids: string[]) => ids?.map((id) => tags.find((t) => t.id === id)).filter(Boolean) ?? [],
    [],
  );

  const createNewTag = async (newTag: Tag) => {
    try {
      await tagRepository.add(newTag);
    } catch (error) {
      console.error(error);
    }
  };

  return {
    tags,
    createNewTag,
    getTagsByIds,
  };
};
