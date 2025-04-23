import { useAppDispatch } from '@/hooks/hooks';
import { removeAllAnnotationsRequest } from '@/state/reducers/annotations';
import { exportTextOfCollectionRequest } from '@/state/reducers/export';
import { fetchBatchOcrRequest } from '@/state/reducers/workers';
import { useTranslation } from 'react-i18next';
import AnalysisMenu from './AnalysisMenu';
import DangerousMenu from './DangerousMenu';
import ExportMenu from './ExportMenu';

const CollectionToolbar = ({ collectionId }: { collectionId: string }) => {
  const { t } = useTranslation();
  const appDispatch = useAppDispatch();

  const handleOcr = () => {
    appDispatch(fetchBatchOcrRequest(collectionId));
  };

  const handleLayout = () => {};

  const handleDeleteAllAnnotations = () => {
    appDispatch(removeAllAnnotationsRequest(collectionId));
  };

  const handleExportText = () => {
    appDispatch(exportTextOfCollectionRequest(collectionId));
  };

  return (
    <div className='panel flex items-center space-x-2'>
      <h2 className='text-md'>{t('title_call_actions')}</h2>
      {/* <Button
        variant={'default'}
        className='cursor-pointer bg-white text-black hover:bg-black hover:text-white'
      >
        
      </Button> */}
      <AnalysisMenu handleLayout={handleLayout} handleOcr={handleOcr} isRunning={false} />
      <DangerousMenu handleDeleteAllAnnotations={handleDeleteAllAnnotations} isRunning={false} />
      <ExportMenu handleExportText={handleExportText} isRunning={false} />
    </div>
  );
};

export default CollectionToolbar;
