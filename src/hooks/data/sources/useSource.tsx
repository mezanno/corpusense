import { SourceWithContent } from '@/data/models/source/source';
import { getSourceRepository } from '@/data/repositories/indexeddb/dbFactory';
import { useQuery } from '@tanstack/react-query';

export const QUERY_KEY_CURRENT_SOURCE = 'currentSource';

const useSource = (sourceId: string) => {
  const {
    error,
    isLoading,
    data: sourceWithContent,
  } = useQuery<SourceWithContent, Error>({
    queryKey: [QUERY_KEY_CURRENT_SOURCE, sourceId],
    queryFn: async () => {
      const sourceRepository = getSourceRepository();
      const sourceResult = await sourceRepository.getById(sourceId);
      if (!sourceResult.ok) {
        throw sourceResult.error;
      }
      const contentResult = await sourceRepository.getContentById(sourceId);
      if (!contentResult.ok) {
        throw contentResult.error;
      }
      return {
        ...sourceResult.value,
        content: contentResult.value,
      };
    },
  });

  const manifest = sourceWithContent?.content.manifest;

  return {
    error,
    isLoading,
    manifest,
    sourceWithContent,
  };
};

export default useSource;
