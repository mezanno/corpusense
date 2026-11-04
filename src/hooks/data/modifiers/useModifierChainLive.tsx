import { ElementType } from '@/data/models/annotations/annotation';
import { ModifierChainDTO } from '@/data/models/modifiers/Modifier';
import { CollectionScope } from '@/data/models/scope/scope';
import { getModifierChainLiveRepository } from '@/data/repositories/indexeddb/dbFactory';
import { applyModifiersToScope, getModifiersAndValues } from '@/data/utils/modifierChain';
import { NotFoundError } from '@/utils/NotFoundError';
import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo } from 'react';

const useModifierChainLive = () => {
  const modifierChainLiveRepository = useMemo(() => getModifierChainLiveRepository(), []);
  const modifierChains = useLiveQuery(
    modifierChainLiveRepository.getAll(),
    [modifierChainLiveRepository],
    [] as ModifierChainDTO[],
  );

  const modifierCount = useMemo(() => {
    return modifierChains.length;
  }, [modifierChains]);

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
      throw new NotFoundError({ entity: 'Modifier chain', id: chainId });
    }

    const { modifiers, modifierValues } = await getModifiersAndValues(chainId);
    await applyModifiersToScope(modifiers, modifierValues, scope, type);
  };

  return { modifierChains, modifierCount, nameAlreadyExists, applyModifierChainToCollection };
};

export default useModifierChainLive;
