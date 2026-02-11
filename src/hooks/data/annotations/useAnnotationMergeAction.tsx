import { Annotation, changeType, duplicateAnnotation, ElementType } from '@/data/models/Annotation';
import { HPModifier } from '@/data/models/modifiers/HPModifier';
import { MergeModifier } from '@/data/models/modifiers/MergeModifier';
import {
  getAnnotationLiveRepository,
  getAnnotationTempRepository,
} from '@/data/repositories/indexeddb/dbFactory';
import { getDimensions } from '@/data/utils/annotations';
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

  const mergeAnnotations = async (
    fromAnnotations: Annotation[],
    verticalThreshold: number,
    horizontalThreshold: number,
  ) => {
    if (fromAnnotations.length > 1) {
      const mergeModifier = new MergeModifier(1000, 1000);
      const mergedAnnotations = mergeModifier.apply(fromAnnotations, {
        verticalThreshold,
        horizontalThreshold,
      });
      if (fromAnnotations.length !== mergedAnnotations.length) {
        console.log(
          'annotations merged: ',
          mergedAnnotations.map((a) => a.id.substring(0, 2)),
        );
        await annotationTempRepository.deleteByCollection(collectionId);
        await annotationTempRepository.addAll(mergedAnnotations);
      }
      return mergedAnnotations;
    }
    return fromAnnotations;
  };

  const disolveAnnotations = async (fromAnnotations: Annotation[], sizeThreshold: number) => {
    if (fromAnnotations.length > 1) {
      const hpModifier = new HPModifier(biggestSurface);
      const disolvedAnnotations = hpModifier.apply(fromAnnotations, { hpThreshold: sizeThreshold });
      if (fromAnnotations.length !== disolvedAnnotations.length) {
        await annotationTempRepository.deleteByCollection(collectionId);
        await annotationTempRepository.addAll(disolvedAnnotations);
      }
      return disolvedAnnotations;
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
