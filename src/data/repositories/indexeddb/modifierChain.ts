import { ModifierChainDTO } from '@/data/models/modifiers/Modifier';
import { FunctionResult } from '@/utils/functionResult';
import { EntityNotFoundError } from '../EntityNotFoundError';
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

  async getById(id: string): Promise<FunctionResult<ModifierChainDTO, EntityNotFoundError>> {
    const modifierChain = await db.modifierChains.get(id);
    if (!modifierChain) {
      return FunctionResult.err(new EntityNotFoundError({ entity: 'ModifierChain', id }));
    }
    return FunctionResult.ok(modifierChain);
  }

  async getByName(name: string): Promise<FunctionResult<ModifierChainDTO, EntityNotFoundError>> {
    const modifierChain = await db.modifierChains.where('name').equals(name).first();
    if (!modifierChain) {
      return FunctionResult.err(new EntityNotFoundError({ entity: 'ModifierChain', id: name }));
    }
    return FunctionResult.ok(modifierChain);
  }

  async delete(id: string): Promise<void> {
    await db.modifierChains.delete(id);
  }
}
