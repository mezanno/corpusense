import { useFSHandleStore } from '@/state/zustand/useFSHandleStore';

const useConvertedFileIO = () => {
  const { addDirectoryHandle } = useFSHandleStore();

  const requestPermission = async () => {
    const handle = await window.showDirectoryPicker({ mode: 'read' });
    await addDirectoryHandle(handle);
  };

  return {
    requestPermission,
  };
};

export default useConvertedFileIO;
