import { Annotation, changeType, duplicateAnnotation, ElementType } from '@/data/models/Annotation';
import {
  getAnnotationLiveRepository,
  getAnnotationRepository,
} from '@/data/repositories/indexeddb/dbFactory';
import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useEffectEvent, useMemo, useState } from 'react';

const useAnnotationMergeAction = ({
  collectionId,
  canvasId,
}: {
  collectionId: string;
  canvasId: string;
}) => {
  const annotationLiveRepository = useMemo(() => getAnnotationLiveRepository(), []);
  const annotationRepository = useMemo(() => getAnnotationRepository(), []);
  const scope = useMemo(() => ({ collectionId, canvasId }), [collectionId, canvasId]);

  const [workingAnnotations, setWorkingAnnotations] = useState<Annotation[]>([]);
  const scopeAnnotations = useLiveQuery(
    annotationLiveRepository.getByScopeAndType(scope, ElementType.TEXT_REGION),
    [scope, annotationLiveRepository],
    [],
  );
  console.log(scopeAnnotations);

  useEffect(() => {
    void (async () => {
      await annotationRepository.deleteByScopeAndType({ collectionId }, [ElementType.TEMP]);
    });
  }, []);

  const onScopeChange = useEffectEvent(() => {
    void (async () => {
      const temps = [];
      for (const annotation of scopeAnnotations) {
        const tempAnnotation = changeType(duplicateAnnotation(annotation), ElementType.TEMP);
        temps.push(tempAnnotation);
      }

      setWorkingAnnotations(temps);
      await annotationRepository.deleteByScopeAndType({ collectionId }, [ElementType.TEMP]);
      await annotationRepository.addAll(temps);
    })();
  });

  useEffect(() => {
    onScopeChange();
  }, [scopeAnnotations]);

  const mergeAnnotations = (verticalThreshold: number, horizontalThreshold: number) => {
    //TODO : implement merge logic
    console.log('mergeAnnotations', { verticalThreshold, horizontalThreshold });
  };

  return { mergeAnnotations };
};

export default useAnnotationMergeAction;
