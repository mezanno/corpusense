import { StepBack, StepForward } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCollectionInspectorContext } from '../reducers/CollectionInspectorContext';

const CollectionNavigation = () => {
  const { t } = useTranslation();
  const { handleNext, handlePrevious, hasNextCanvas, hasPreviousCanvas } =
    useCollectionInspectorContext();

  return (
    <div className='flex w-full justify-center space-x-2 p-2'>
      {hasPreviousCanvas() && (
        <button
          className='soft-button'
          onClick={handlePrevious}
          title={t('btn_previous_canvas')}
          aria-label={t('btn_previous_canvas')}
        >
          <StepBack size={14} />
        </button>
      )}
      {hasNextCanvas() && (
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
