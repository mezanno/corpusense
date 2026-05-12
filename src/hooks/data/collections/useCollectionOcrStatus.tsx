import { getAnnotationLiveRepository } from '@/data/repositories/indexeddb/dbFactory';
import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo } from 'react';

const useCollectionOcrStatus = ({ collectionId }: { collectionId: string }) => {
  const annotationLiveRepository = useMemo(() => getAnnotationLiveRepository(), []);

  const hasOcr = useLiveQuery(
    annotationLiveRepository.hasOcrAnnotations({ collectionId }),
    [collectionId],
    false,
  );

  return hasOcr;
};

export default useCollectionOcrStatus;
