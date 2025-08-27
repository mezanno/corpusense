import { DataModel } from '@/data/models/DataModel';
import { Worker } from '@/data/models/Worker';
import { useAppDispatch, useAppSelector } from '@/hooks/hooks';
import {
  recomputeRegionsRequest,
  removeAllCollectionAnnotationsRequest,
} from '@/state/reducers/annotations';
import { exportTextOfCollectionRequest } from '@/state/reducers/export';
import {
  exportWorkerResultRequest,
  recoverWorkerRequest,
  startWorkerProcess,
} from '@/state/reducers/workers';
import { isWorkerOrTaskRunning } from '@/state/selectors/workers';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import SelectModelForm from './textviewer/SelectModelForm';
import Toolbar from './ToolBar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';

const CollectionToolbar = ({ collectionId }: { collectionId: string }) => {
  const { t } = useTranslation();
  const appDispatch = useAppDispatch();
  const isWorkerRunning = useAppSelector((state) => isWorkerOrTaskRunning(state, { collectionId }));
  const [dialogOpen, setDialogOpen] = useState(false);

  if (isWorkerRunning) {
    return (
      <div className='panel'>
        <strong>{t('info_worker_running')}</strong>
      </div>
    );
  }

  const handleOcr = () => {
    appDispatch(
      startWorkerProcess({
        workerName: 'peroocr',
        params: {},
        scope: { collectionId },
      }),
    );
  };

  const handleOcrWrite = () => {
    appDispatch(
      startWorkerProcess({
        workerName: 'surya',
        params: {},
        scope: { collectionId },
      }),
    );
  };

  const handleLayout = () => {
    appDispatch(
      startWorkerProcess({
        workerName: 'edwin',
        params: {},
        scope: { collectionId },
      }),
    );
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

  const handleExportResult = (worker: Worker) => {
    appDispatch(exportWorkerResultRequest({ worker }));
  };

  const handleRecoverWorker = (worker: Worker) => {
    appDispatch(recoverWorkerRequest(worker));
  };

  const close = (model: DataModel) => {
    setDialogOpen(false);

    if (collectionId !== undefined) {
      appDispatch(
        startWorkerProcess({
          workerName: 'mistral',
          params: {
            model,
            workerName: 'mistral',
          },
          scope: { collectionId },
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
        handleExportResult={handleExportResult}
        handleRecoverWorker={handleRecoverWorker}
        handleOcrWrite={handleOcrWrite}
        scope={{ collectionId }}
      />
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('title_generate_data')}</DialogTitle>
            <DialogDescription>{t('description_select_model')}</DialogDescription>
          </DialogHeader>
          <SelectModelForm close={close} collectionId={collectionId} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CollectionToolbar;
