import { CollectionDetails } from '@/data/models/Collection';
import { getCollectonLiveRepository } from '@/data/repositories/indexeddb/dbFactory';
import { useLiveQuery } from 'dexie-react-hooks';
import { createContext, useCallback, useContext, useMemo, useState } from 'react';

type CollectionContextValue = {
  collectionId: string | null;
  setCollectionId: (collectionId: string | null) => void;
  openedCollections: CollectionDetails[];
  openCollection: (collectionId: string) => void;
  removeFromOpenedCollections: (id: string) => void;
};

export const CollectionContext = createContext<CollectionContextValue | undefined>(undefined);

type Props = {
  children: React.ReactNode;
};

export const CollectionProvider = ({ children }: Props) => {
  const [collectionId, setCollectionId] = useState<string | null>(null);
  const [openedIds, setOpenedIds] = useState<string[]>([]);
  const collectionLiveRepository = useMemo(() => getCollectonLiveRepository(), []);

  const openedCollections = useLiveQuery(
    collectionLiveRepository.getAllDetailsByIds(openedIds),
    [openedIds],
    [] as CollectionDetails[],
  );

  const openCollection = useCallback((id: string) => {
    setOpenedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    setCollectionId(id);
  }, []);

  const removeFromOpenedCollections = useCallback(
    (id: string) => {
      setOpenedIds((prev) => prev.filter((openedId) => openedId !== id));
      if (collectionId === id) setCollectionId(null);
    },
    [collectionId],
  );

  const value: CollectionContextValue = {
    collectionId,
    setCollectionId,
    openedCollections,
    openCollection,
    removeFromOpenedCollections,
  };

  return <CollectionContext.Provider value={value}>{children}</CollectionContext.Provider>;
};

export const useCollectionContext = () => {
  const context = useContext(CollectionContext);
  if (context === undefined) {
    throw new Error('useCollectionContext must be used within a CollectionProvider');
  }
  return context;
};
