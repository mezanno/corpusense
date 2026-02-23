import { ElementType } from '@/data/models/Annotation';
import { AnyModifier } from '@/data/models/modifiers/Modifier';
import {
  getAnnotationLiveRepository,
  getAnnotationRepository,
  getModifierChainRepository,
} from '@/data/repositories/indexeddb/dbFactory';
import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo } from 'react';
import { v4 as uuid } from 'uuid';

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

  const saveModifierChain = async (modifiers: AnyModifier[], values: Record<string, unknown>) => {
    if (modifiers.length === 0) return;

    const chainDTO = {
      id: uuid(),
      name: `Modifier Chain ${new Date().toLocaleString()}`,
      modifiers: modifiers.map((modifier) => {
        const rawValues = values[modifier.id] ?? {};
        const parsedValues = modifier.schema.parse(rawValues);

        return {
          id: modifier.id,
          type: modifier.type,
          values: parsedValues,
        };
      }),
    };
    console.log('chain DTO : ', chainDTO);

    const modifierChainRepository = getModifierChainRepository();
    await modifierChainRepository.add(chainDTO);
  };

  const applyModifierChain = async (modifiers: AnyModifier[], values: Record<string, unknown>) => {
    if (modifiers.length === 0) return;
    let annotations = [...scopeAnnotations];
    modifiers.forEach((modifier) => {
      const modifierValues = values[modifier.id];
      if (modifierValues !== undefined) {
        const rawValues = values[modifier.id] ?? {};
        const parsedValues = modifier.schema.parse(rawValues);
        annotations = modifier.apply(annotations, parsedValues);
      }
    });

    const annotationRepository = getAnnotationRepository();
    await annotationRepository.deleteByIds(scopeAnnotations.map((a) => a.id));
    await annotationRepository.addAll(annotations);
  };

  return { applyModifierChain, saveModifierChain };
};

export default useModifierChain;
