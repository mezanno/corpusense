import { History } from '@/data/models/History';
import { StoredManifestDetails } from '@/data/models/StoredManifest';
import {
  getManifestLiveRepository,
  getManifestRepository,
} from '@/data/repositories/indexeddb/dbFactory';
import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo } from 'react';

export const useManifests = () => {
  const manifestLiveRepository = useMemo(() => getManifestLiveRepository(), []);
  const manifestRepository = useMemo(() => getManifestRepository(), []);

  const history = useLiveQuery(manifestLiveRepository.getHistoryEntries(), [], [] as History[]);

  const getDetailsFn = useMemo(() => {
    const ids = history?.map((h) => h.url) ?? [];
    return manifestLiveRepository.getDetailsByManifestIds(ids);
  }, [history, manifestLiveRepository]);

  const historyDetails = useLiveQuery(getDetailsFn, [getDetailsFn], [] as StoredManifestDetails[]);

  /**
   * Deletes the manifest from IndexedDB.
   * @param url The URL of the manifest to remove from history.
   */
  const removeFromHistory = async (url: string) => {
    try {
      await manifestRepository.deleteFromHistory(url);
    } catch (error) {
      console.warn('Error removing url from indexedDB history: ', error);
    }
  };

  return {
    historyDetails,
    removeFromHistory,
  };
};
