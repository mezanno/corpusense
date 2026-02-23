import { ElementType } from '@/data/models/Annotation';
import { AnyModifier } from '@/data/models/modifiers/Modifier';
import { modifierRegistry } from '@/data/models/modifiers/ModifierFactory';
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
    const modifierChainRepository = getModifierChainRepository();
    await modifierChainRepository.add(chainDTO);
  };

  const loadModifierChain = async (
    name: string,
  ): Promise<{
    modifiers: AnyModifier[];
    modifierValues: Record<string, unknown>;
  }> => {
    const modifierChainRepository = getModifierChainRepository();
    const modifierDTO = await modifierChainRepository.getByName(name);

    const modifiers = modifierDTO.modifiers.map((dto) => {
      const factory = modifierRegistry[dto.type];
      if (factory === undefined || factory === null) {
        throw new Error(`No factory found for modifier type: ${dto.type}`);
      }
      const modifier = factory.create();
      modifier.id = dto.id; // Assigner l'ID du DTO au modifier créé
      return modifier;
    });

    const modifierValues: Record<string, unknown> = {};
    modifierDTO.modifiers.forEach((dto) => {
      modifierValues[dto.id] = dto.values;
    });

    return { modifiers, modifierValues };
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

  return { applyModifierChain, saveModifierChain, loadModifierChain };
};

export default useModifierChain;
