import { ElementType } from '@/data/models/Annotation';
import { AnyModifier } from '@/data/models/modifiers/Modifier';
import {
  getAnnotationLiveRepository,
  getAnnotationRepository,
} from '@/data/repositories/indexeddb/dbFactory';
import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo } from 'react';
import z from 'zod';

const useModifierChain = ({
  collectionId,
  canvasId,
}: {
  collectionId: string;
  canvasId: string;
}) => {
  const annotationLiveRepository = useMemo(() => getAnnotationLiveRepository(), []);
  const scope = useMemo(() => ({ collectionId, canvasId }), [collectionId, canvasId]);

  const scopeAnnotations = useLiveQuery(
    annotationLiveRepository.getByScopeAndType(scope, ElementType.TEXT_REGION),
    [scope, annotationLiveRepository],
    [],
  );

  const applyModifierChain = async (modifiers: AnyModifier[], values: Record<string, unknown>) => {
    if (modifiers.length === 0) return;
    let annotations = [...scopeAnnotations];
    modifiers.forEach((modifier) => {
      const modifierValues = values[modifier.id];
      if (modifierValues !== undefined) {
        // const valid = modifier.schema.safeParse(modifierValues);
        // if (valid.success) {
        // annotations = modifier.apply(annotations, valid.data);
        annotations = modifier.apply(
          annotations,
          values[modifier.id] as z.infer<typeof modifier.schema>,
        );
        // } else {
        //   console.error('Invalid modifier values for modifier ', modifier.name, ': ', valid.error);
        // }
        console.log(modifier.name, ':', annotations);
      }
    });

    const annotationRepository = getAnnotationRepository();
    await annotationRepository.deleteByIds(scopeAnnotations.map((a) => a.id));
    await annotationRepository.addAll(annotations);
  };

  return { applyModifierChain };
};

export default useModifierChain;
