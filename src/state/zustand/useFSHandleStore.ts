import { getFSHandleRepository } from '@/data/repositories/indexeddb/dbFactory';
import { create } from 'zustand';

interface FSHandleState {
  directoryHandles: FileSystemDirectoryHandle[];
  addDirectoryHandle: (handle: FileSystemDirectoryHandle) => Promise<void>;
  getDirectoryHandle: (directoryName: string) => FileSystemDirectoryHandle | undefined;
}

export const useFSHandleStore = create<FSHandleState>((set, get) => ({
  directoryHandles: [],
  cachedFileHandles: new Map(),

  addDirectoryHandle: async (handle: FileSystemDirectoryHandle) => {
    set((state) => ({
      directoryHandles: [...state.directoryHandles, handle],
    }));
    const fsHandleRepository = getFSHandleRepository();
    await fsHandleRepository.put({ id: handle.name, handle });
  },
  getDirectoryHandle: (directoryName: string) => {
    const { directoryHandles } = get();
    console.log('getDirectoryHandle in ', directoryHandles);

    return directoryHandles.find((handle) => handle.name === directoryName);
  },
  loadDirectoryHandles: async () => {
    const fsHandleRepository = getFSHandleRepository();
    const handlers = await fsHandleRepository.getAll();
    set({ directoryHandles: handlers.map((item) => item.handle) });
  },
}));
