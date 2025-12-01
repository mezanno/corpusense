import { Annotation, getAnnotationType } from '@/data/models/Annotation';
import { Scope } from '@/data/models/Scope';
import { getAnnotationLiveRepository } from '@/data/repositories/indexeddb/dbFactory';
import { useLiveQuery } from 'dexie-react-hooks';
import { useCallback, useMemo } from 'react';

export const useAnnotationsForCanvas = (scope: Scope) => {
  const annotationLiveRepository = useMemo(() => getAnnotationLiveRepository(), []);

  const annotations = useLiveQuery(
    annotationLiveRepository.getByScope(scope),
    [scope],
    [] as Annotation[],
  );

  const getAnnotationsByTypes = useCallback(
    (types: string[]) => {
      return annotations.filter((annotation) => types.includes(getAnnotationType(annotation)));
    },
    [annotations],
  );

  const getLastOrderByType = useCallback(
    (type: string) => {
      const annotationsByType = getAnnotationsByTypes([type]);
      if (annotationsByType.length === 0) {
        return 1;
      }
      return annotationsByType[annotationsByType.length - 1].order ?? 1;
    },
    [getAnnotationsByTypes],
  );

  return {
    annotations,
    getAnnotationsByTypes,
    getLastOrderByType,
  };
};
