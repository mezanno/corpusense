import { getConvertedFileRepository } from '@/data/repositories/indexeddb/dbFactory';
import { useMemo } from 'react';

const useConvertedFileIO = () => {
  const convertedFilesRepository = useMemo(() => getConvertedFileRepository(), []);

  const removeConvertedFile = async (id: string) => {
    await convertedFilesRepository.delete(id);
  };

  return {
    removeConvertedFile,
  };
};

export default useConvertedFileIO;
