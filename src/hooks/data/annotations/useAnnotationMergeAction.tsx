import {
  Annotation,
  changeType,
  duplicateAnnotation,
  ElementType,
  getDistanceBetweenAnnotations,
  mergeTwoAnnotations,
} from '@/data/models/Annotation';
import {
  getAnnotationLiveRepository,
  getAnnotationRepository,
} from '@/data/repositories/indexeddb/dbFactory';
import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useEffectEvent, useMemo } from 'react';

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

  // const [workingAnnotations, setWorkingAnnotations] = useState<Annotation[]>([]);
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

      // setWorkingAnnotations(temps);
      await annotationRepository.deleteByScopeAndType({ collectionId }, [ElementType.TEMP]);
      await annotationRepository.addAll(temps);
    })();
  });

  useEffect(() => {
    onScopeChange();
  }, [scopeAnnotations]);

  const mergeAnnotations = async (verticalThreshold: number, horizontalThreshold: number) => {
    if (scopeAnnotations.length > 1) {
      let annotations = [];
      for (const annotation of scopeAnnotations) {
        const tempAnnotation = changeType(duplicateAnnotation(annotation), ElementType.TEMP);
        annotations.push(tempAnnotation);
      }
      annotations.sort(
        (a, b) => a.target.selector.geometry.bounds.minY - b.target.selector.geometry.bounds.minY,
      );
      // console.log(
      //   'annotations to merge: ',
      //   annotations.map((a) => a.id.substring(0, 2)),
      // );

      const mergedAnnotations: Annotation[] = [];
      const notMerged: Annotation[] = [];
      let current = annotations.shift()!;
      do {
        do {
          const next = annotations.shift()!;
          const distance = getDistanceBetweenAnnotations(current, next);
          // console.log('current: ', current.id.substring(0, 2));
          // console.log('next: ', next.id.substring(0, 2));
          // console.log(
          //   'annotations: ',
          //   annotations.map((a) => a.id.substring(0, 2)),
          // );
          // console.log(
          //   'notMerged: ',
          //   notMerged.map((a) => a.id.substring(0, 2)),
          // );
          if (
            Math.abs(distance.vertical) <= verticalThreshold &&
            Math.abs(distance.horizontal) <= horizontalThreshold
          ) {
            // console.log('oui');
            current = mergeTwoAnnotations(current, next);
            annotations = [...notMerged, ...annotations];
          } else {
            // console.log('non');
            notMerged.push(next);
          }
        } while (annotations.length > 0);
        mergedAnnotations.push(current);
        // console.log(
        //   'merged: ',
        //   mergedAnnotations.map((a) => a.id.substring(0, 2)),
        // );
        current = notMerged.shift()!;
        annotations = [...notMerged];
        //clear notMerged for next iteration
        notMerged.length = 0;
      } while (annotations.length > 0);
      mergedAnnotations.push(current, ...annotations);
      // console.log(
      //   'mergedAnnotations: ',
      //   mergedAnnotations.map((a) => a.id.substring(0, 2)),
      // );
      await annotationRepository.deleteByScopeAndType({ collectionId }, [ElementType.TEMP]);
      // setWorkingAnnotations(mergedAnnotations);
      await annotationRepository.addAll(mergedAnnotations);
    }
  };

  return { mergeAnnotations };
};

export default useAnnotationMergeAction;
