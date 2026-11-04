import { Project } from '@/data/models/project';
import { getProjectLiveRepository } from '@/data/repositories/indexeddb/dbFactory';
import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo } from 'react';

const useProjects = () => {
  const projectLiveRepository = useMemo(() => getProjectLiveRepository(), []);

  const projects = useLiveQuery(
    projectLiveRepository.getAll(),
    [projectLiveRepository],
    [] as Project[],
  );

  const projectNameAlreadyExists = (name: string) => {
    return projects.some((p) => p.name.toLowerCase() === name.toLowerCase());
  };

  return {
    projects,
    projectNameAlreadyExists,
  };
};

export default useProjects;
