import { CollectionDetails } from '@/data/models/collection/collection';
import { getCollectionLiveRepository } from '@/data/repositories/indexeddb/dbFactory';
import { getFile } from '@/data/utils/canvas';
import { useLiveQuery } from 'dexie-react-hooks';
import { createContext, useCallback, useContext, useMemo, useState } from 'react';

type CollectionContextValue = {
  collectionId: string | null;
  setCollectionId: (collectionId: string | null) => void;
  openedCollections: CollectionDetails[];
  openCollection: (collectionId: string) => void;
  removeFromOpenedCollections: (id: string) => void;
  getLocalObjectUrl: (path: string, handle: FileSystemDirectoryHandle) => Promise<string>;
};

const CollectionContext = createContext<CollectionContextValue | undefined>(undefined);

type Props = {
  children: React.ReactNode;
};

export const CollectionProvider = ({ children }: Props) => {
  const [collectionId, setCollectionId] = useState<string | null>(null);
  const [openedIds, setOpenedIds] = useState<string[]>([]);
  const collectionLiveRepository = useMemo(() => getCollectionLiveRepository(), []);
  const [localUrlObjectsMap, setLocalUrlObjectsMap] = useState<Record<string, string>>({});

  const openedCollections = useLiveQuery(
    collectionLiveRepository.getAllDetailsByIds(openedIds),
    [openedIds],
    [] as CollectionDetails[],
  );

  const openCollection = useCallback(
    (id: string) => {
      setOpenedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
      setCollectionId(id);
      //clear the local url objects map (and revoke url objects) when opening a new collection to avoid keeping urls of previous collection that might not be relevant anymore
      Object.values(localUrlObjectsMap).forEach((url) => URL.revokeObjectURL(url));
      setLocalUrlObjectsMap({});
    },
    [localUrlObjectsMap],
  );

  const removeFromOpenedCollections = useCallback(
    (id: string) => {
      setOpenedIds((prev) => prev.filter((openedId) => openedId !== id));
      if (collectionId === id) setCollectionId(null);
    },
    [collectionId],
  );

  const getLocalObjectUrl = useCallback(
    async (path: string, handle: FileSystemDirectoryHandle) => {
      if (localUrlObjectsMap[path]) return localUrlObjectsMap[path];

      const url = URL.createObjectURL(await getFile(path, handle));
      setLocalUrlObjectsMap((prev) => ({ ...prev, [path]: url }));
      return url;
    },
    [localUrlObjectsMap],
  );

  const value: CollectionContextValue = {
    collectionId,
    setCollectionId,
    openedCollections,
    openCollection,
    removeFromOpenedCollections,
    getLocalObjectUrl,
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
