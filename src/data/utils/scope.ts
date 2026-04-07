import { Scope } from '../models/Scope';
import { getCollectionRepository } from '../repositories/indexeddb/dbFactory';

const contains = async (scope: Scope, value: string) => {
  const collectionRepository = getCollectionRepository();
  try {
    const collection = await collectionRepository.getById(scope.collectionId);
    return collection.name.toLowerCase().includes(value.toLowerCase());
  } catch (error) {
    console.error('Error fetching collection: ', error);
    return false;
  }
};

export { contains };
