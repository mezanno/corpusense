import { BaseError } from '@/utils/BaseError';

/**
 * Generic not-found error: names the entity that was looked for and the id
 * it was looked up by. Replaces the former EntityNotFoundError, which was
 * behaviourally identical but located inside the IndexedDB repository layer.
 */
export class NotFoundError extends BaseError {
  constructor(context: { entity: string; id: string }) {
    super(`${context.entity} with id ${context.id} not found`, { context });
  }
}
