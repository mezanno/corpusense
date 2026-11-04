import { Annotation, ElementType } from '@/data/models/annotations/annotation';
import { changeType, duplicateAnnotation } from '@/data/models/annotations/annotation.factory';
import { AnyModifier } from '@/data/models/modifiers/Modifier';
import { CanvasScope } from '@/data/models/scope/scope';
import {
  getAnnotationLiveRepository,
  getAnnotationRepository,
  getAnnotationTempRepository,
} from '@/data/repositories/indexeddb/dbFactory';
import { useLiveQuery } from 'dexie-react-hooks';
import { useCallback, useEffect, useEffectEvent, useMemo } from 'react';

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
  const { canvasId, collectionId } = scope;
  const getScopeAnnotations = useCallback(
    () => annotationLiveRepository.getByScopeAndType(scope, applyModifierChainTo)(),
    [annotationLiveRepository, canvasId, collectionId, applyModifierChainTo],
  );

  const scopeAnnotations = useLiveQuery(getScopeAnnotations, [getScopeAnnotations], []);

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
    for (const modifier of modifiers) {
      const modifierValues = values[modifier.id];
      if (modifierValues !== undefined) {
        const rawValues = values[modifier.id] ?? {};
        const parsedValues = modifier.schema.parse(rawValues);
        annotations = await modifier.apply(annotations, parsedValues);
      }
    }

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
