import { AnyModifier } from '@/data/models/modifiers/Modifier';
import { getModifierChainRepository } from '@/data/repositories/indexeddb/dbFactory';
import { getModifiersAndValues, ModifierChainData } from '@/data/utils/modifierChain';
import { v4 as uuid } from 'uuid';

const useModifierChainIO = () => {
  const saveModifierChain = async (
    name: string,
    modifiers: AnyModifier[],
    values: Record<string, unknown>,
  ) => {
    if (modifiers.length === 0) return;

    const modifierChainRepository = getModifierChainRepository();
    const existingChain = await modifierChainRepository.getByName(name);

    const chainDTO = {
      id: existingChain?.id ?? uuid(),
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

    await modifierChainRepository.put(chainDTO);
  };

  const loadModifierChain = async (id: string): Promise<ModifierChainData> => {
    return getModifiersAndValues(id);
  };

  const removeModifierChain = async (id: string) => {
    const modifierChainRepository = getModifierChainRepository();
    await modifierChainRepository.delete(id);
  };

  return {
    saveModifierChain,
    loadModifierChain,
    removeModifierChain,
  };
};

export default useModifierChainIO;
