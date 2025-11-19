import { getFSHandleRepository } from '@/data/repositories/indexeddb/dbFactory';
import { create } from 'zustand';

interface FSHandleState {
  rootHandle: FileSystemDirectoryHandle | undefined;
  setRootHandle: (handle: FileSystemDirectoryHandle) => Promise<void>;
  loadRootHandle: () => Promise<FileSystemDirectoryHandle | undefined>;
}

export const useFSHandleStore = create<FSHandleState>((set) => ({
  rootHandle: undefined,

  setRootHandle: async (handle: FileSystemDirectoryHandle) => {
    set({ rootHandle: handle });
    const fsHandleRepository = getFSHandleRepository();
    await fsHandleRepository.put({ id: 'root', handle });
  },
  loadRootHandle: async () => {
    const fsHandleRepository = getFSHandleRepository();
    try {
      const handle = await fsHandleRepository.getById('root');
      set({ rootHandle: handle?.handle });
      return handle?.handle;
    } catch (err) {
      console.error('Failed to load root handle:', err);
    }
  },
}));
