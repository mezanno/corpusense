import { NamedEntity } from '@/data/models/NamedEntity';
import { db } from './db';
import { NamedEntityRepository } from './types';

export class IndexedDBNamedEntityRepository implements NamedEntityRepository {
  async getByAnnotationId(annotationId: string): Promise<NamedEntity[]> {
    return await db.namedEntities.where('annotationIds').equals(annotationId).toArray();
  }
  async getNamedEntitiesByAnnotationsIds(annotationIds: string[]): Promise<NamedEntity[]> {
    return await db.namedEntities.where('annotationIds').anyOf(annotationIds).toArray();
  }
  async add(entity: NamedEntity): Promise<void> {
    //TODO! vérifier si un mot de l'entité existe déjà dans une autre entité
    await db.namedEntities.add(entity);
  }
}
