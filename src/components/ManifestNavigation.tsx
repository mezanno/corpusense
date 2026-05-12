import { StepBack, StepForward } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useManifestPageContext } from './reducers/ManifestPageContext';

const ManifestNavigation = () => {
  const { t } = useTranslation();
  const { handlePrevious, hasPrevious, handleNext, hasNext } = useManifestPageContext();

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
