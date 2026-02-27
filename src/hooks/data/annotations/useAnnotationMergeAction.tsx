import { Annotation, changeType, duplicateAnnotation, ElementType } from '@/data/models/Annotation';
import { CanvasScope } from '@/data/models/Scope';
import {
  getAnnotationLiveRepository,
  getAnnotationTempRepository,
} from '@/data/repositories/indexeddb/dbFactory';
import { getDimensions } from '@/data/utils/annotations';
import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useEffectEvent, useMemo, useState } from 'react';

const useAnnotationMergeAction = ({ scope }: { scope: CanvasScope }) => {
  const annotationLiveRepository = useMemo(() => getAnnotationLiveRepository(), []);
  const annotationTempRepository = useMemo(() => getAnnotationTempRepository(), []);
  const [tempAnnotations, setTempAnnotations] = useState<Annotation[]>([]);

  const scopeAnnotations = useLiveQuery(
    annotationLiveRepository.getByScopeAndType(scope, ElementType.TEXT_REGION),
    [scope, annotationLiveRepository],
    [],
  );

  const biggestSurface = useMemo(() => {
    let maxSurface = 0;
    for (const annotation of scopeAnnotations) {
      const dimensions = getDimensions(annotation);
      const surface = dimensions.width * dimensions.height;
      if (surface > maxSurface) {
        maxSurface = surface;
      }
    }
    return maxSurface;
  }, [scopeAnnotations]);

  useEffect(() => {
    void (async () => {
      await annotationTempRepository.deleteByCollection(scope.collectionId);
    });

    return () => {
      void (async () => {
        await annotationTempRepository.deleteByCollection(scope.collectionId);
      })();
    };
  }, []);

  const onScopeChange = useEffectEvent(() => {
    void (async () => {
      const temps = [];
      for (const annotation of scopeAnnotations) {
        const tempAnnotation = changeType(duplicateAnnotation(annotation), ElementType.TEMP);
        temps.push(tempAnnotation);
      }
      await annotationTempRepository.deleteByCollection(scope.collectionId);
      await annotationTempRepository.addAll(temps);
      setTempAnnotations(temps);
    })();
  });

  useEffect(() => {
    onScopeChange();
  }, [scopeAnnotations]);

  return { biggestSurface };
};

export default useAnnotationMergeAction;
