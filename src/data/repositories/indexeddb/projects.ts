import { Project } from '@/data/models/project';
import { SourceAlreadyInProjectError } from '@/data/utils/errors';
import { FunctionResult } from '@/utils/functionResult';
import { NotFoundError } from '@/utils/NotFoundError';
import { EntityNotFoundError } from '../EntityNotFoundError';
import { db } from './db';
import { ProjectRepository } from './types';

export class IndexedDBProjectRepository implements ProjectRepository {
  async getAll(): Promise<Project[]> {
    return await db.projects.toArray();
  }

  async getById(id: string): Promise<FunctionResult<Project, EntityNotFoundError>> {
    const project = await db.projects.get(id);
    if (!project) {
      return FunctionResult.err(new EntityNotFoundError({ entity: 'Project', id }));
    }
    return FunctionResult.ok(project);
  }

  async add(project: Project): Promise<void> {
    await db.projects.add(project);
  }

  async addSource(
    projectId: string,
    sourceId: string,
  ): Promise<FunctionResult<void, NotFoundError | SourceAlreadyInProjectError>> {
    const result = await this.getById(projectId);
    if (!result.ok) {
      return result;
    }
    const project = result.value;
    if (project.sources.includes(sourceId)) {
      return FunctionResult.err(new SourceAlreadyInProjectError({ projectId, sourceId }));
    }
    project.sources.push(sourceId);
    await db.projects.put(project);
    return FunctionResult.ok(undefined);
  }
}
