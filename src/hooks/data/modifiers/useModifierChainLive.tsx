import { ElementType } from '@/data/models/Annotation';
import { CollectionScope } from '@/data/models/Scope';
import { getModifierChainLiveRepository } from '@/data/repositories/indexeddb/dbFactory';
import { applyModifiersToScope, getModifiersAndValues } from '@/data/utils/modifierChain';
import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo } from 'react';

const useModifierChainLive = () => {
  const modifierChainLiveRepository = useMemo(() => getModifierChainLiveRepository(), []);
  const modifierChains = useLiveQuery(
    modifierChainLiveRepository.getAll(),
    [modifierChainLiveRepository],
    [],
  );

  const nameAlreadyExists = (name: string): boolean => {
    return modifierChains?.some((chain) => chain.name === name) ?? false;
  };

  const applyModifierChainToCollection = async (
    chainId: string,
    scope: CollectionScope,
    type: ElementType,
  ) => {
    const modifierChain = modifierChains?.find((chain) => chain.id === chainId);
    if (!modifierChain) {
      throw new Error(`Modifier chain with id ${chainId} not found`);
    }

    const { modifiers, modifierValues } = await getModifiersAndValues(chainId);
    await applyModifiersToScope(modifiers, modifierValues, scope, type);
  };

  return { modifierChains, nameAlreadyExists, applyModifierChainToCollection };
};

export default useModifierChainLive;
