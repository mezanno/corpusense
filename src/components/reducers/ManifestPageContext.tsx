import useConvertedFileIO from '@/hooks/data/convertedFiles/useConvertedFileIO';
import { useAppDispatch, useAppSelector } from '@/hooks/hooks';
import { fecthManifestRequest } from '@/state/reducers/manifests';
import { Canvas, Manifest } from '@iiif/presentation-3';
import { findIndex } from 'lodash';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

type ManifestPageContextValue = {
  manifest: Manifest | undefined;
  isLoading: boolean;
  hasPrevious: boolean;
  hasNext: boolean;
  handleNext: () => void;
  handlePrevious: () => void;
  setSearchParams: (searchParams: URLSearchParams) => void;
  canvasToDisplay: Canvas | null;
  setCanvasToDisplay: (canvas: Canvas | null) => void;
};

export const ManifestPageContext = createContext<ManifestPageContextValue | undefined>(undefined);

type Props = {
  children: React.ReactNode;
};

export const ManifestPageProvider = ({ children }: Props) => {
  const appDispatch = useAppDispatch();
  const { isLoading, loadedData } = useAppSelector((state) => state.manifests);
  const { loadManifest } = useConvertedFileIO();
  const [canvasToDisplay, setCanvasToDisplay] = useState<Canvas | null>(null);

  const manifest = loadedData?.content;

  const canvasIds = useMemo(() => manifest?.items.map((canvas) => canvas.id) ?? [], [manifest]);

  const currentCanvasIndex =
    canvasToDisplay !== null ? findIndex(canvasIds, (id) => id === canvasToDisplay.id) : 0;

  const hasPrevious = currentCanvasIndex > 0;
  const hasNext = currentCanvasIndex < canvasIds.length - 1;

  const handleNext = () => {
    const nextCanvas = manifest?.items[currentCanvasIndex + 1];
    if (nextCanvas) {
      setCanvasToDisplay(nextCanvas);
    }
  };

  const handlePrevious = () => {
    const previousCanvas = manifest?.items[currentCanvasIndex - 1];
    if (previousCanvas) {
      setCanvasToDisplay(previousCanvas);
    }
  };

  const setSearchParams = (searchParams: URLSearchParams) => {
    const id = searchParams.get('manifestId');
    if (id != null) {
      appDispatch(fecthManifestRequest(id));
    } else {
      const indexeddbId = searchParams.get('indexeddbId');

      if (indexeddbId != null) {
        try {
          void loadManifest(indexeddbId);
        } catch (error) {
          console.error('Error loading manifest from IndexedDB:', error);
        }
      }
    }
    setCanvasToDisplay(null);
  };

  useEffect(() => {
    if (isLoading) {
      setCanvasToDisplay(null);
    }
  }, [isLoading]);

  const value: ManifestPageContextValue = {
    isLoading,

    manifest,
    hasPrevious,
    hasNext,
    handleNext,
    handlePrevious,
    setSearchParams,
    canvasToDisplay,
    setCanvasToDisplay,
  };

  return <ManifestPageContext.Provider value={value}>{children}</ManifestPageContext.Provider>;
};

export const useManifestPageContext = () => {
  const context = useContext(ManifestPageContext);
  if (context === undefined) {
    throw new Error('useManifestPageContext must be used within a ManifestPageProvider');
  }
  return context;
};
