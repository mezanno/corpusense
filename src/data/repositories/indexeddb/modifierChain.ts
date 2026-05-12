import { ModifierChainDTO } from '@/data/models/modifiers/Modifier';
import { db } from './db';
import { ModifierChainRepository } from './types';

export class IndexedDBModifierChainRepository implements ModifierChainRepository {
  async add(chain: ModifierChainDTO): Promise<void> {
    await db.modifierChains.add(chain);
  }

  async put(chain: ModifierChainDTO): Promise<void> {
    await db.modifierChains.put(chain);
  }

  async getAll(): Promise<ModifierChainDTO[]> {
    return await db.modifierChains.toArray();
  }

  async getById(id: string): Promise<ModifierChainDTO> {
    const modifierChain = await db.modifierChains.get(id);
    if (!modifierChain) {
      throw new Error(`Modifier chain with id "${id}" not found`);
    }
    return modifierChain;
  }

  async getByName(name: string): Promise<ModifierChainDTO | undefined> {
    return await db.modifierChains.where('name').equals(name).first();
  }

  async delete(id: string): Promise<void> {
    await db.modifierChains.delete(id);
  }
}
