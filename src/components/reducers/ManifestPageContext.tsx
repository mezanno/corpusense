import useSource from '@/hooks/data/sources/useSource';
import { Canvas, Manifest } from '@iiif/presentation-3';
import { findIndex } from 'lodash';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

type ManifestPageContextValue = {
  manifest: Manifest | undefined;
  sourceWithContent: ReturnType<typeof useSource>['sourceWithContent'] | undefined;
  isLoading: boolean;
  hasPrevious: boolean;
  hasNext: boolean;
  handleNext: () => void;
  handlePrevious: () => void;
  canvasToDisplay: Canvas | null;
  setCanvasToDisplay: (canvas: Canvas | null) => void;
};

const ManifestPageContext = createContext<ManifestPageContextValue | undefined>(undefined);

type Props = {
  children: React.ReactNode;
};

export const ManifestPageProvider = ({ children }: Props) => {
  const [searchParams] = useSearchParams();
  const [canvasToDisplay, setCanvasToDisplay] = useState<Canvas | null>(null);

  const id = searchParams.get('manifestId');
  const { isLoading, sourceWithContent, manifest } = useSource(id ?? '');

  const canvasIds = useMemo(() => manifest?.items.map((canvas) => canvas.id) ?? [], [manifest]);

  const currentCanvasIndex =
    canvasToDisplay !== null ? findIndex(canvasIds, (cId) => cId === canvasToDisplay.id) : 0;

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

  useEffect(() => {
    if (isLoading) {
      setCanvasToDisplay(null);
    }
  }, [isLoading, setCanvasToDisplay]);

  const value: ManifestPageContextValue = {
    isLoading,
    manifest,
    sourceWithContent,
    hasPrevious,
    hasNext,
    handleNext,
    handlePrevious,
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
