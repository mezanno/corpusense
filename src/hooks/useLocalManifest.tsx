import { createContext, Dispatch, SetStateAction, useContext, useState } from 'react';

type LocalManifestContextType = {
  setHandles: Dispatch<SetStateAction<Map<string, FileSystemFileHandle>>>;
  getHandle: (path: string) => FileSystemFileHandle | undefined;
  handles: Map<string, FileSystemFileHandle>;
};

const localManifestContext = createContext<LocalManifestContextType | undefined>(undefined);

export const LocalManifestProvider = ({ children }: { children: React.ReactNode }) => {
  const [handles, setHandles] = useState<Map<string, FileSystemFileHandle>>(new Map());

  console.log('LocalManifestProvider: handles ', handles);

  const getHandle = (path: string): FileSystemFileHandle | undefined => {
    return handles.get(path);
  };

  return (
    <localManifestContext.Provider value={{ setHandles, getHandle, handles }}>
      {children}
    </localManifestContext.Provider>
  );
};

const useLocalManifest = () => {
  const context = useContext(localManifestContext);
  if (!context) {
    throw new Error('useLocalManifest doit être utilisé dans un <LocalManifestProvider>');
  }
  return context;
};

export default useLocalManifest;
