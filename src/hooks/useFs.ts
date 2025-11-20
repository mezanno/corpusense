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

export const getObjectUrl = async (filename: string): Promise<string> => {
  const filenameShort = filename.includes('/') ? filename.split('/').pop() : filename;

  const { rootHandle } = useFSHandleStore.getState();
  if (rootHandle === undefined) {
    throw new Error('No directory selected');
  }

  for await (const [, entry] of rootHandle.entries()) {
    if (entry.kind === 'file' && entry.name === filenameShort) {
      const fileHandle = entry;
      const fileData = await fileHandle.getFile();
      return URL.createObjectURL(fileData);
    }
  }

  throw new Error('File not found');
};

const getContent = async (handle: FileSystemFileHandle): Promise<string> => {
  const file = await handle.getFile();
  return file.type === 'application/pdf' ? await fileToBase64(file) : await file.text();
};

const useFs = () => {
  const [files, setFiles] = useState<Map<string, FileSystemFileHandle>>(new Map());
  const { setRootHandle, loadRootHandle, rootHandle } = useFSHandleStore();

  useEffect(() => {
    void loadRootHandle();
  }, []);

  useEffect(() => {
    async function getPermission() {
      if (rootHandle !== undefined) {
        const permissions = await rootHandle.requestPermission({ mode: 'readwrite' });
        if (permissions !== 'granted') {
          console.warn('Permission to access the directory was denied.');
          return;
        }
        void parseDirectory();
      }
    }
    void getPermission();
  }, [rootHandle]);

  const parseDirectory = async () => {
    if (rootHandle === undefined) return;
    const filesInDirectory = await parseDirectoryForFiles(rootHandle, ['.pdf', '.json']);
    setFiles(filesInDirectory);
  };

  const onSelectDirectory = async () => {
    if ('showDirectoryPicker' in window) {
      try {
        const handle = await window.showDirectoryPicker({ mode: 'readwrite' });
        await setRootHandle(handle);
      } catch (error) {
        console.error('Error selecting directory:', error);
      }
    }
  };

  const getFileContent = async (fileName: string): Promise<string> => {
    const fileHandle = files.get(fileName);
    if (fileHandle === undefined) throw new Error('File not found');
    return await getContent(fileHandle);
  };

  const getFile = async (filename: string): Promise<File> => {
    const fileHandle = files.get(filename);

    //if the file does not exists in the list, parse the directory again for this specific file
    if (fileHandle !== undefined) {
      return await fileHandle.getFile();
    }

    const file = await parseDirectoryForFile(rootHandle!, filename);

    if (file === undefined) {
      throw new Error('File not found');
    }
    setFiles(new Map([...files, [filename, file]]));
    console.log(files);

    return await file.getFile();
  };

  const writeFile = async (fileName: string, content: ArrayBuffer | string) => {
    if (rootHandle === undefined) throw new Error('No directory selected');
    const fileHandle = await rootHandle.getFileHandle(fileName, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(content);
    await writable.close();
  };

  return {
    isBrowserSupported: window !== undefined && 'showDirectoryPicker' in window,
    onSelectDirectory,
    files,
    getFile,
    getFileContent,
    writeFile,
  };
};
export default useFs;
