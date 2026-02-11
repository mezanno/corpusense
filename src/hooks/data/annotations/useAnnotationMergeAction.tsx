import {
  Annotation,
  changeType,
  duplicateAnnotation,
  ElementType,
  getDimensions,
  getDistanceBetweenAnnotations,
  mergeTwoAnnotations,
} from '@/data/models/Annotation';
import {
  getAnnotationLiveRepository,
  getAnnotationTempRepository,
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
  const annotationTempRepository = useMemo(() => getAnnotationTempRepository(), []);
  const scope = useMemo(() => ({ collectionId, canvasId }), [collectionId, canvasId]);
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
      await annotationTempRepository.deleteByCollection(collectionId);
    });

    return () => {
      void (async () => {
        await annotationTempRepository.deleteByCollection(collectionId);
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
      await annotationTempRepository.deleteByCollection(collectionId);
      await annotationTempRepository.addAll(temps);
      setTempAnnotations(temps);
    })();
  });

  useEffect(() => {
    onScopeChange();
  }, [scopeAnnotations]);

  //TODO: extract logic to a util function and test it
  const mergeAnnotations = async (
    fromAnnotations: Annotation[],
    verticalThreshold: number,
    horizontalThreshold: number,
  ) => {
    if (fromAnnotations.length > 1) {
      const annotations = [...fromAnnotations];
      annotations.sort(
        (a, b) => a.target.selector.geometry.bounds.minY - b.target.selector.geometry.bounds.minY,
      );
      console.log(
        'annotations to merge: ',
        annotations.map((a) => a.id.substring(0, 2)),
      );

      let changed = true;
      while (changed) {
        changed = false;
        for (let i = 0; i < annotations.length; i++) {
          for (let j = i + 1; j < annotations.length; j++) {
            const distance = getDistanceBetweenAnnotations(annotations[i], annotations[j]);
            if (
              Math.abs(distance.vertical) <= verticalThreshold &&
              Math.abs(distance.horizontal) <= horizontalThreshold
            ) {
              annotations[i] = mergeTwoAnnotations(annotations[i], annotations[j]);
              annotations.splice(j, 1);
              changed = true;
              break; // Break the inner loop to restart checking from the beginning
            }
          }
          if (changed) {
            break; // Break the outer loop to restart checking from the beginning
          }
        }
      }
      if (fromAnnotations.length !== annotations.length) {
        console.log(
          'annotations merged: ',
          annotations.map((a) => a.id.substring(0, 2)),
        );
        await annotationTempRepository.deleteByCollection(collectionId);
        await annotationTempRepository.addAll(annotations);
      }
      return annotations;
    }
    return fromAnnotations;
  };

  const disolveAnnotations = async (fromAnnotations: Annotation[], sizeThreshold: number) => {
    if (fromAnnotations.length > 1) {
      const annotations = [...fromAnnotations];
      for (let i = 0; i < annotations.length; i++) {
        const dimensions = getDimensions(annotations[i]);
        if (dimensions.width * dimensions.height < sizeThreshold) {
          annotations.splice(i, 1);
          i--;
        }
      }
      if (fromAnnotations.length !== annotations.length) {
        // console.log(
        //   'annotations merged: ',
        //   annotations.map((a) => a.id.substring(0, 2)),
        // );
        await annotationTempRepository.deleteByCollection(collectionId);
        await annotationTempRepository.addAll(annotations);
      }
      return annotations;
    }
    return fromAnnotations;
  };

  const disolve = async (sizeThreshold: number) => {
    await disolveAnnotations(tempAnnotations, sizeThreshold);
  };

  const merge = async (verticalThreshold: number, horizontalThreshold: number) => {
    await mergeAnnotations(tempAnnotations, verticalThreshold, horizontalThreshold);
  };

  const mergeAndDissolve = async (
    verticalThreshold: number,
    horizontalThreshold: number,
    sizeThreshold: number,
  ) => {
    const mergedAnnotations = await mergeAnnotations(
      tempAnnotations,
      verticalThreshold,
      horizontalThreshold,
    );
    await disolveAnnotations(mergedAnnotations, sizeThreshold);
  };

  return { merge, disolve, mergeAndDissolve, biggestSurface };
};

export default useAnnotationMergeAction;
