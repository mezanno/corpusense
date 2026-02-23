import { AnyModifier } from '@/data/models/modifiers/Modifier';
import { modifierRegistry } from '@/data/models/modifiers/ModifierFactory';
import {
  getModifierChainLiveRepository,
  getModifierChainRepository,
} from '@/data/repositories/indexeddb/dbFactory';
import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo } from 'react';
import { v4 as uuid } from 'uuid';

const useModifierChainIO = () => {
  const modifierChainLiveRepository = useMemo(() => getModifierChainLiveRepository(), []);
  const modifierChains = useLiveQuery(
    modifierChainLiveRepository.getAll(),
    [modifierChainLiveRepository],
    [],
  );

  const saveModifierChain = async (
    name: string,
    modifiers: AnyModifier[],
    values: Record<string, unknown>,
  ) => {
    if (modifiers.length === 0) return;

    const chainDTO = {
      id: uuid(),
      name,
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

  const nameAlreadyExists = (name: string): boolean => {
    return modifierChains?.some((chain) => chain.name === name) ?? false;
  };

  return { modifierChains, saveModifierChain, loadModifierChain, nameAlreadyExists };
};

export default useModifierChainIO;
