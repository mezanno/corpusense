import { getConvertedFileRepository } from '@/data/repositories/indexeddb/dbFactory';
import { useAppDispatch } from '@/hooks/hooks';
import { fecthManifestRequest } from '@/state/reducers/manifests';
import { useFSHandleStore } from '@/state/zustand/useFSHandleStore';
import { useCallback, useMemo } from 'react';

const useConvertedFileIO = () => {
  const appDispatch = useAppDispatch();
  const convertedFilesRepository = useMemo(() => getConvertedFileRepository(), []);
  const { addDirectoryHandle } = useFSHandleStore();

  const removeConvertedFile = async (id: string) => {
    await convertedFilesRepository.delete(id);
  };

  const loadManifest = useCallback(async (id: string) => {
    try {
      const convertedFile = await convertedFilesRepository.getById(id);
      const handle = convertedFile.outputDirectoryHandle;
      const perm = await handle.queryPermission({ mode: 'read' });
      if (perm !== 'granted') {
        throw new Error('No permission to read the manifest directory');
      }

      const manifestFileHandle = await handle.getFileHandle(convertedFile.manifestName);
      const manifestFile = await manifestFileHandle.getFile();
      const manifestText = await manifestFile.text();
      appDispatch(fecthManifestRequest(manifestText));
    } catch (e) {
      console.error(e);
    }
  }, []);

  const requestPermission = async () => {
    const handle = await window.showDirectoryPicker({ mode: 'read' });
    await addDirectoryHandle(handle);
  };

  return {
    loadManifest,
    removeConvertedFile,
    requestPermission,
  };
};

export default useConvertedFileIO;
