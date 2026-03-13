import { Canvas, Manifest } from '@iiif/presentation-3';
import { findIndex } from 'lodash';
import { StepBack, StepForward } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

const ManifestNavigation = ({
  manifest,
  currentCanvasId,
  setCanvasToDisplay,
}: {
  manifest: Manifest;
  currentCanvasId: string;
  setCanvasToDisplay: (canvas: Canvas | null) => void;
}) => {
  const { t } = useTranslation();

  const canvasIds = useMemo(() => manifest.items.map((canvas) => canvas.id), [manifest]);
  const currentCanvasIndex = useMemo(
    () => findIndex(canvasIds, (id) => id === currentCanvasId),
    [canvasIds, currentCanvasId],
  );
  const hasPrevious = currentCanvasIndex > 0;
  const hasNext = currentCanvasIndex < canvasIds.length - 1;

  const handleNext = () => {
    const nextCanvas = manifest.items[currentCanvasIndex + 1];
    setCanvasToDisplay(nextCanvas);
  };

  const handlePrevious = () => {
    const previousCanvas = manifest.items[currentCanvasIndex - 1];
    setCanvasToDisplay(previousCanvas);
  };

  return (
    <div className='flex w-full justify-center space-x-2 p-2'>
      {hasPrevious && (
        <button
          className='soft-button'
          onClick={handlePrevious}
          title={t('btn_previous_canvas')}
          aria-label={t('btn_previous_canvas')}
        >
          <StepBack size={14} />
        </button>
      )}
      {hasNext && (
        <button
          className='soft-button'
          onClick={handleNext}
          title={t('btn_next_canvas')}
          aria-label={t('btn_next_canvas')}
        >
          <StepForward size={14} />
        </button>
      )}
    </div>
  );
};

export default ManifestNavigation;
