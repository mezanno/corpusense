import { ModifierChainDTO } from '@/data/models/modifiers/Modifier';
import { db } from '../db';
import { ModifierChainLiveRepository } from './types.live';

export class IndexedDBModifierChainlLiveRepository implements ModifierChainLiveRepository {
  getAll(): () => Promise<ModifierChainDTO[]> {
    return () => db.modifierChains.toArray();
  }
}
