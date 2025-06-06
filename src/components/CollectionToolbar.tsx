import { DataModel } from '@/data/models/DataModel';
import { useAppDispatch } from '@/hooks/hooks';
import {
  recomputeRegionsRequest,
  removeAllCollectionAnnotationsRequest,
} from '@/state/reducers/annotations';
import { exportTextOfCollectionRequest } from '@/state/reducers/export';
import {
  fetchBatchLayoutRequest,
  fetchBatchOcrRequest,
  startWorkerProcess,
} from '@/state/reducers/workers';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import SelectModelForm from './textviewer/SelectModelForm';
import Toolbar from './ToolBar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';

const CollectionToolbar = ({ collectionId }: { collectionId: string }) => {
  const { t } = useTranslation();
  const appDispatch = useAppDispatch();
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleOcr = () => {
    appDispatch(fetchBatchOcrRequest(collectionId));
  };

  const handleLayout = () => {
    appDispatch(fetchBatchLayoutRequest(collectionId));
  };

  const handleDeleteAllAnnotations = () => {
    appDispatch(removeAllCollectionAnnotationsRequest(collectionId));
  };

  const handleRecomputeRegions = () => {
    appDispatch(recomputeRegionsRequest(collectionId));
  };

  const handleExportText = () => {
    appDispatch(exportTextOfCollectionRequest(collectionId));
  };

  const handleExtractData = () => {
    setDialogOpen(true);
  };

  const close = (model: DataModel) => {
    setDialogOpen(false);

    if (collectionId !== undefined) {
      appDispatch(
        startWorkerProcess({
          workerName: 'mistral',
          params: {
            scope: { collectionId },
            model,
          },
        }),
      );
    }
  };

  return (
    <div className='panel'>
      <Toolbar
        title={t('title_collection_actions')}
        handleLayout={handleLayout}
        handleOcr={handleOcr}
        handleDeleteAllAnnotations={handleDeleteAllAnnotations}
        handleExportText={handleExportText}
        handleExtractData={handleExtractData}
        handleRecomputeRegions={handleRecomputeRegions}
        elementId={collectionId}
      />
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('title_generate_data')}</DialogTitle>
            <DialogDescription>{t('description_select_model')}</DialogDescription>
          </DialogHeader>
          <SelectModelForm close={close} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CollectionToolbar;
