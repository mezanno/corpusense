import { getProjectRepository } from '@/data/repositories/indexeddb/dbFactory';
import { pushError } from '@/state/reducers/events';
import { getErrorMessage } from '@/utils/utils';
import { useMemo } from 'react';
import { v4 as uuid } from 'uuid';
import { useAppDispatch } from '../../hooks';

const useProjectsIO = () => {
  const appDispatch = useAppDispatch();
  const projectRespository = useMemo(() => getProjectRepository(), []);

  const getProjectById = async (id: string) => {
    return await projectRespository.getById(id);
  };

  const createProject = async (name: string) => {
    const newProject = {
      id: uuid(),
      name,
      createdAt: new Date(),
      updatedAt: new Date(),
      sources: [],
      collections: [],
    };
    await projectRespository.add(newProject);
    return newProject;
  };

  const addSourceToProject = async (projectId: string, sourceId: string) => {
    const result = await projectRespository.addSource(projectId, sourceId);
    if (!result.ok) {
      appDispatch(pushError(getErrorMessage(result.error)));
    }
    return result;
  };

  return {
    createProject,
    getProjectById,
    addSourceToProject,
  };
};

export default useProjectsIO;
