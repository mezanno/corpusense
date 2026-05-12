import { ConvertedFile } from '@/data/models/ConvertedFile';
import { getConvertedFileLiveRepository } from '@/data/repositories/indexeddb/dbFactory';
import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo } from 'react';

export const useConvertedFiles = () => {
  const convertedFilesRepository = useMemo(() => getConvertedFileLiveRepository(), []);

  const convertedFiles = useLiveQuery(convertedFilesRepository.getAll(), [], [] as ConvertedFile[]);

  return {
    convertedFiles,
  };
};
