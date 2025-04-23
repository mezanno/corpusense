import { useAppDispatch } from '@/hooks/hooks';
import { fetchBatchOcrRequest } from '@/state/reducers/workers';
import { useTranslation } from 'react-i18next';
import AnalysisMenu from './AnalysisMenu';

const CollectionToolbar = ({ collectionId }: { collectionId: string }) => {
  const { t } = useTranslation();
  const appDispatch = useAppDispatch();

  const handleOcr = () => {
    appDispatch(fetchBatchOcrRequest(collectionId));
  };

  const handleLayout = () => {};

  return (
    <div className='panel flex items-center space-x-2'>
      <h2 className='text-md'>{t('title_call_actions')}</h2>
      {/* <Button
        variant={'default'}
        className='cursor-pointer bg-white text-black hover:bg-black hover:text-white'
      >
        
      </Button> */}
      <AnalysisMenu handleLayout={handleLayout} handleOcr={handleOcr} isRunning={false} />
    </div>
  );
};

export default CollectionToolbar;
