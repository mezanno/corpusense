import { getModifierChainLiveRepository } from '@/data/repositories/indexeddb/dbFactory';
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

  return { modifierChains, nameAlreadyExists };
};

export default useModifierChainLive;
