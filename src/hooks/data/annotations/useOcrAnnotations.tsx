import { CanvasScope } from '@/data/models/Scope';
import { getAnnotationLiveRepository } from '@/data/repositories/indexeddb/dbFactory';
import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo } from 'react';

const useOcrAnnotations = (scope: CanvasScope) => {
  const annotationLiveRepository = useMemo(getAnnotationLiveRepository, []);

  const hasOcrAnnotations = useLiveQuery(
    annotationLiveRepository.hasOcrAnnotations(scope),
    [scope, annotationLiveRepository],
    false,
  );

  return { hasOcrAnnotations };
};

export default useOcrAnnotations;
