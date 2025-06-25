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

  async removeByAnnotationIds(annotationIds: string[]): Promise<void> {
    // Get all named entities that contain any of the specified annotation IDs
    const entitiesToRemove = await this.getNamedEntitiesByAnnotationsIds(annotationIds);

    // If there are no entities to remove, return early
    if (entitiesToRemove.length === 0) return;

    // Delete all found entities from the database
    await db.namedEntities.bulkDelete(entitiesToRemove.map((entity) => entity.id));
  }
}
