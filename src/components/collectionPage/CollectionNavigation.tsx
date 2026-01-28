import { useCollectionContent } from '@/hooks/data/collections/useCollectionContent';
import { Canvas } from '@iiif/presentation-3';
import { StepBack, StepForward } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const CollectionNavigation = ({
  collectionId,
  currentCanvasId,
  setCanvasToDisplay,
}: {
  collectionId: string;
  currentCanvasId: string;
  setCanvasToDisplay: (canvas: Canvas | null) => void;
}) => {
  const { t } = useTranslation();
  const { hasNextCanvas, hasPreviousCanvas, getNextCanvas, getPreviousCanvas } =
    useCollectionContent(collectionId);

  const handleNext = () => {
    const nextCanvas = getNextCanvas(currentCanvasId);
    if (nextCanvas) {
      setCanvasToDisplay(nextCanvas);
    }
  };

  const handlePrevious = () => {
    const previousCanvas = getPreviousCanvas(currentCanvasId);
    if (previousCanvas) {
      setCanvasToDisplay(previousCanvas);
    }
  };

  return (
    <div className='flex w-full justify-center space-x-2 p-2'>
      {hasPreviousCanvas(currentCanvasId) && (
        <button
          className='soft-button'
          onClick={handlePrevious}
          title={t('btn_previous_canvas')}
          aria-label={t('btn_previous_canvas')}
        >
          <StepBack size={14} />
        </button>
      )}
      {hasNextCanvas(currentCanvasId) && (
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

export default CollectionNavigation;
