import { ModifierChainDTO } from '@/data/models/modifiers/Modifier';
import { db } from './db';
import { ModifierChainRepository } from './types';

export class IndexedDBModifierChainRepository implements ModifierChainRepository {
  async add(chain: ModifierChainDTO): Promise<void> {
    await db.modifierChains.add(chain);
  }

  async getAll(): Promise<ModifierChainDTO[]> {
    return await db.modifierChains.toArray();
  }

  async delete(id: string): Promise<void> {
    await db.modifierChains.delete(id);
  }
}
