import { Source } from '@/data/models/source/source';
import {
  getCollectionRepository,
  getProjectRepository,
  getSourceLiveRepository,
  getSourceRepository,
} from '@/data/repositories/indexeddb/dbFactory';
import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo } from 'react';

const useLiveSources = () => {
  const sourceLiveRepository = useMemo(() => getSourceLiveRepository(), []);

  const remoteSources = useLiveQuery(
    sourceLiveRepository.getAll('remote'),
    [sourceLiveRepository],
    [] as Source[],
  );

  const localSources = useLiveQuery(
    sourceLiveRepository.getAll('local'),
    [sourceLiveRepository],
    [] as Source[],
  );

  const sourcesCount = useMemo(() => {
    return {
      remote: remoteSources.length,
      local: localSources.length,
    };
  }, [remoteSources, localSources]);

  const removeUnusedSources = async () => {
    const allRemoteSourceIds = remoteSources.map((s) => s.id);

    // Get all projects and their source IDs
    const projectRepository = getProjectRepository();
    const allProjects = await projectRepository.getAll();
    const projectSourceIds = [...new Set(allProjects.flatMap((project) => project.sources))];

    const unusedSourceIds = allRemoteSourceIds.filter((id) => !projectSourceIds.includes(id));

    //Get all sources used in collections
    const collectionRepository = getCollectionRepository();
    const allCollectionIds = (await collectionRepository.getAllDetails()).map(
      (collection) => collection.id,
    );
    const collectionSourceIdsArrays = await Promise.all(
      allCollectionIds.map(async (collectionId) => {
        const result = await collectionRepository.getSourceIdsByCollectionId(collectionId);
        if (result.ok) {
          return result.value;
        } else {
          return [];
        }
      }),
    );
    const collectionSourceIds = [...new Set(collectionSourceIdsArrays.flat())];

    const trulyUnusedSourceIds = unusedSourceIds.filter((id) => !collectionSourceIds.includes(id));
    const sourceRepository = getSourceRepository();
    // en sweep de nettoyage, une source déjà absente (err NotFoundError) n'est pas un échec
    await Promise.all(trulyUnusedSourceIds.map((id) => sourceRepository.deleteById(id)));
  };

  return {
    remoteSources,
    localSources,
    sourcesCount,
    removeUnusedSources,
  };
};

export default useLiveSources;
