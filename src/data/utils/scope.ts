import { Scope } from '../models/scope/scope';
import { getCollectionRepository } from '../repositories/indexeddb/dbFactory';

const contains = async (scope: Scope, value: string) => {
  const collectionRepository = getCollectionRepository();

  const collectionResult = await collectionRepository.getById(scope.collectionId);
  if (!collectionResult.ok) {
    return false;
  }
  return collectionResult.value.name.toLowerCase().includes(value.toLowerCase());
};

export { contains };
