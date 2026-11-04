import { db } from '@/data/repositories/indexeddb/db';
import { getSourceRepository } from '@/data/repositories/indexeddb/dbFactory';
import { useLiveQuery } from 'dexie-react-hooks';
import { useCallback, useState } from 'react';

/**
 * Detects legacy data still present in storedManifests or convertedFiles
 * tables that has not yet been migrated to the new sources/sourceContents schema.
 * Provides a `migrateAll` function to trigger the full migration on user action.
 */
const usePendingMigration = () => {
  const [isMigrating, setIsMigrating] = useState(false);

  // Re-runs whenever storedManifests or convertedFiles tables change
  const pendingCount =
    useLiveQuery<number>(async () => {
      const sourceRepository = getSourceRepository();
      return sourceRepository.getPendingMigrationCount();
    }, [db.storedManifests, db.convertedFiles]) ?? 0;

  const migrateAll = useCallback(async () => {
    setIsMigrating(true);
    try {
      const sourceRepository = getSourceRepository();
      await sourceRepository.migrateAllSources();
    } finally {
      setIsMigrating(false);
    }
  }, []);

  return {
    pendingCount,
    isMigrating,
    migrateAll,
  };
};

export default usePendingMigration;
