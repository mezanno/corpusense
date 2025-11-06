import { useContext } from 'react';
import { CanvasViewerContext } from './CanvasViewerContext';

export const useCanvasViewerContext = () => {
  const context = useContext(CanvasViewerContext);
  if (!context) {
    throw new Error('useExampleContext must be used within a ExampleProvider');
  }
  return context;
};
