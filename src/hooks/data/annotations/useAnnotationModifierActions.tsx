import { Annotation, changeType, duplicateAnnotation, ElementType } from '@/data/models/Annotation';
import { AnyModifier } from '@/data/models/modifiers/Modifier';
import { CanvasScope } from '@/data/models/Scope';
import {
  getAnnotationLiveRepository,
  getAnnotationRepository,
  getAnnotationTempRepository,
} from '@/data/repositories/indexeddb/dbFactory';
import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useEffectEvent, useMemo } from 'react';

const duplicateAnnotations = (fromAnnotations: Annotation[]) => {
  const duplicatedAnnotations = [];
  for (const annotation of fromAnnotations) {
    const tempAnnotation = changeType(duplicateAnnotation(annotation), ElementType.TEMP);
    duplicatedAnnotations.push(tempAnnotation);
  }
  return duplicatedAnnotations;
};

const useAnnotationModifierActions = ({
  scope,
  showPreview,
  applyModifierChainTo,
}: {
  scope: CanvasScope;
  showPreview: boolean;
  applyModifierChainTo: ElementType;
}) => {
  const annotationLiveRepository = useMemo(() => getAnnotationLiveRepository(), []);
  const annotationTempRepository = useMemo(() => getAnnotationTempRepository(), []);

  const scopeAnnotations = useLiveQuery(
    annotationLiveRepository.getByScopeAndType(scope, applyModifierChainTo),
    [scope, applyModifierChainTo, annotationLiveRepository],
    [],
  );

  // const biggestSurface = useMemo(() => {
  //   let maxSurface = 0;
  //   for (const annotation of scopeAnnotations) {
  //     const dimensions = getDimensions(annotation);
  //     const surface = dimensions.width * dimensions.height;
  //     if (surface > maxSurface) {
  //       maxSurface = surface;
  //     }
  //   }
  //   return maxSurface;
  // }, [scopeAnnotations]);

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
      await annotationTempRepository.deleteByCollection(scope.collectionId);
      if (showPreview === false) return;

      const temps = duplicateAnnotations(scopeAnnotations);
      await annotationTempRepository.addAll(temps);
    })();
  });

  useEffect(() => {
    onScopeChange();
  }, [scopeAnnotations, showPreview]);

  const applyModifierChain = async (modifiers: AnyModifier[], values: Record<string, unknown>) => {
    if (modifiers.length === 0) return;
    const annotationRepository = getAnnotationRepository();
    const annotationsToModify = showPreview
      ? duplicateAnnotations(scopeAnnotations)
      : scopeAnnotations;

    let annotations = [...annotationsToModify];
    modifiers.forEach((modifier) => {
      const modifierValues = values[modifier.id];
      if (modifierValues !== undefined) {
        const rawValues = values[modifier.id] ?? {};
        const parsedValues = modifier.schema.parse(rawValues);
        annotations = modifier.apply(annotations, parsedValues);
      }
    });

    if (showPreview) {
      await annotationTempRepository.deleteByCollection(scope.collectionId);
      await annotationTempRepository.addAll(annotations);
    } else {
      await annotationRepository.deleteByIds(annotationsToModify.map((a) => a.id));
      await annotationRepository.addAll(annotations);
    }
  };

  return { applyModifierChain };
};

export default useAnnotationModifierActions;
