import { History } from '@/data/models/History';
import { StoredManifestDetails } from '@/data/models/StoredManifest';
import { db } from '../db';
import { ManifestLiveRepository } from './types.live';

export class IndexedDBManifestLiveRepository implements ManifestLiveRepository {
  getHistoryEntries(): () => Promise<History[]> {
    return () => db.history.toArray();
  }

  getDetailsByManifestIds(manifestIds: string[]): () => Promise<StoredManifestDetails[]> {
    console.log('getDetailsByManifestIds: ', manifestIds);
    return () => db.storedManifests.where('id').anyOf(manifestIds).toArray();
  }
}
