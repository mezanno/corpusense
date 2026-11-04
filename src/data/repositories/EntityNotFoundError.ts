import { NotFoundError } from '@/utils/NotFoundError';

/**
 * @deprecated Prefer {@link NotFoundError} (src/utils/NotFoundError.ts).
 * Kept as an alias during the Table-seam migration; delete once all importers move.
 */
export class EntityNotFoundError extends NotFoundError {}
