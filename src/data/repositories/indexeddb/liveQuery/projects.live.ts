import { Project } from '@/data/models/project';
import { db } from '../db';
import { ProjectLiveRepository } from './types.live';

export class IndexedDBProjectLiveRepository implements ProjectLiveRepository {
  getAll(): () => Promise<Project[]> {
    return () => db.projects.toArray();
  }
}
