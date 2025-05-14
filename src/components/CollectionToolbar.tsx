import { useAppDispatch } from '@/hooks/hooks';
import { removeAllCollectionAnnotationsRequest } from '@/state/reducers/annotations';
import { exportTextOfCollectionRequest } from '@/state/reducers/export';
import { fetchBatchLayoutRequest, fetchBatchOcrRequest } from '@/state/reducers/workers';
import { useTranslation } from 'react-i18next';
import Toolbar from './ToolBar';

const CollectionToolbar = ({ collectionId }: { collectionId: string }) => {
  const { t } = useTranslation();
  const appDispatch = useAppDispatch();

  const handleOcr = () => {
    appDispatch(fetchBatchOcrRequest(collectionId));
  };

  const handleLayout = () => {
    appDispatch(fetchBatchLayoutRequest(collectionId));
  };

  const handleDeleteAllAnnotations = () => {
    appDispatch(removeAllCollectionAnnotationsRequest(collectionId));
  };

  const handleExportText = () => {
    appDispatch(exportTextOfCollectionRequest(collectionId));
  };

  return (
    <div className='panel'>
      <Toolbar
        title={t('title_collection_actions')}
        handleLayout={handleLayout}
        handleOcr={handleOcr}
        handleDeleteAllAnnotations={handleDeleteAllAnnotations}
        handleExportText={handleExportText}
      />
    </div>
  );
};

export default CollectionToolbar;
