import { useFSHandleStore } from '@/state/zustand/useFSHandleStore';
import { useEffect, useState } from 'react';

//convert a File object to a base64 string
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      // reader.result = "data:application/pdf;base64,XXX"
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function imageToBase64(image: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result); // data:image/...;base64,...
      } else {
        reject(new Error('Conversion en base64 échouée'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(image);
  });
}

export function getFolder(path: string): string {
  const parts = path.split('/');

  if (parts.length < 2) {
    throw new Error(`Le fichier "${path}" n'est pas dans un dossier.`);
  }

  // Tous les éléments sauf le dernier (le fichier)
  return parts.slice(0, -1).join('/');
}

export async function getFile(filename: string): Promise<File> {
  const { cachedFileHandles, getDirectoryHandle, addFileHandleToCache } =
    useFSHandleStore.getState();

  const fileHandle = cachedFileHandles.get(filename);

  if (fileHandle !== undefined) {
    console.log('file found in cacbe');

    return await fileHandle.getFile();
  }

  //if the file does not exists in the cache, parse the directory again for this specific file
  const folder = getFolder(filename);
  console.log('looking in folder ', folder);
  const currentDirectoryHandle = getDirectoryHandle(folder);
  if (currentDirectoryHandle === undefined) {
    throw new Error('No directory selected');
  }
  const file = await parseDirectoryForFile(currentDirectoryHandle, filename);

  if (file === undefined) {
    throw new Error('File not found');
  }
  addFileHandleToCache(file);

  return await file.getFile();
}

//parse a directory using the File System Access API
const parseDirectoryForFiles = async (
  handle: FileSystemDirectoryHandle,
  extensions?: string[],
): Promise<Map<string, FileSystemFileHandle>> => {
  const filesMap: Map<string, FileSystemFileHandle> = new Map();
  for await (const [, entry] of handle.entries()) {
    if (
      entry.kind === 'file' &&
      (extensions === undefined ||
        extensions.length === 0 ||
        extensions.some((ext) => entry.name.endsWith(ext)))
    ) {
      const fileHandle = entry;
      filesMap.set(entry.name, fileHandle);
    }
  }
  return filesMap;
};

export const parseDirectoryForFile = async (
  handle: FileSystemDirectoryHandle,
  filename: string,
): Promise<FileSystemFileHandle | undefined> => {
  //TODO: gérer s'il s'agit du chemin complet ou juste du nom de fichier
  const file = filename.split('/').pop();
  if (file === undefined) {
    throw new Error('Invalid file name');
  }

  for await (const [, entry] of handle.entries()) {
    if (entry.kind === 'file' && entry.name === file) {
      const fileHandle = entry;
      return fileHandle;
    }
  }
};

const getContent = async (handle: FileSystemFileHandle): Promise<string> => {
  const file = await handle.getFile();
  return file.type === 'application/pdf' ? await fileToBase64(file) : await file.text();
};

const useFs = () => {
  // const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const {
    addDirectoryHandle,
    loadDirectoryHandles,
    directoryHandles,
    cachedFileHandles,
    addFileHandlesToCache,
    addFileHandleToCache,
  } = useFSHandleStore();
  const [currentDirectoryHandle, setCurrentDirectoryHandle] = useState<
    FileSystemDirectoryHandle | undefined
  >(undefined);

  console.log('directoryHandles: ', directoryHandles);
  console.log('cachedFileHandles: ', cachedFileHandles);

  useEffect(() => {
    void loadDirectoryHandles();
    // //start an interval to parse the directories every minute to update the file handles
    // intervalRef.current = setInterval(async () => {
    //   for (const handle of directoryHandles) {
    //     const files = await parseDirectoryForFiles(handle, ['.pdf', '.json', '.png']);
    //     addFileHandlesToCache(files);
    //   }
    // }, 60000);
    // return () => {
    //   if (intervalRef.current) {
    //     clearInterval(intervalRef.current);
    //   }
    // };
  }, []);

  // useEffect(() => {
  //   const requestPermissions = async () => {
  //     for (const handle of directoryHandles) {
  //       if (handle !== undefined) {
  //         const permissions = await handle.requestPermission({ mode: 'readwrite' });
  //         if (permissions !== 'granted') {
  //           console.warn('Permission to access the directory was denied.');
  //           return;
  //         }
  //       }
  //     }
  //     void parseDirectories();
  //   };
  //   void requestPermissions();
  // }, [directoryHandles]);

  const onSelectDirectory = async () => {
    if ('showDirectoryPicker' in window) {
      try {
        const handle = await window.showDirectoryPicker({ mode: 'readwrite' });
        await addDirectoryHandle(handle);
        setCurrentDirectoryHandle(handle);

        const filesInDirectory = await parseDirectoryForFiles(handle, ['.pdf', '.json', '.png']);
        addFileHandlesToCache(filesInDirectory);
      } catch (error) {
        console.error('Error selecting directory:', error);
      }
    }
  };

  const getFileContent = async (fileName: string): Promise<string> => {
    const fileHandle = cachedFileHandles.get(fileName);
    if (fileHandle === undefined) throw new Error('File not found');
    return await getContent(fileHandle);
  };

  const writeFile = async (fileName: string, content: ArrayBuffer | string) => {
    if (currentDirectoryHandle === undefined) throw new Error('No directory selected');
    const fileHandle = await currentDirectoryHandle.getFileHandle(fileName, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(content);
    await writable.close();
    addFileHandleToCache(fileHandle);
  };

  return {
    isBrowserSupported: window !== undefined && 'showDirectoryPicker' in window,
    onSelectDirectory,
    getFile,
    getFileContent,
    writeFile,
    cachedFileHandles,
    currentDirectoryHandle,
  };
};
export default useFs;
