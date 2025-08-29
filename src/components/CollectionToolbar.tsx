import { ElementType } from '@/data/models/Annotation';
import { DataModel } from '@/data/models/DataModel';
import { Worker } from '@/data/models/Worker';
import { useAppDispatch, useAppSelector } from '@/hooks/hooks';
import {
  recomputeRegionsRequest,
  removeAnnotationsByScopeRequest,
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
import RemoveAnnotationsForm from './RemoveAnnotationsForm';
import SelectModelForm from './textviewer/SelectModelForm';
import Toolbar from './ToolBar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';

const CollectionToolbar = ({ collectionId }: { collectionId: string }) => {
  const { t } = useTranslation();
  const appDispatch = useAppDispatch();
  const isWorkerRunning = useAppSelector((state) => isWorkerOrTaskRunning(state, { collectionId }));
  const [analysisDialogOpen, setAnalysisDialogOpen] = useState(false);
  const [removeAnnotationsDialogOpen, setRemoveAnnotationsDialogOpen] = useState(false);

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
    setRemoveAnnotationsDialogOpen(true);
  };

  const handleRecomputeRegions = () => {
    appDispatch(recomputeRegionsRequest(collectionId));
  };

  const handleExportText = () => {
    appDispatch(exportTextOfCollectionRequest(collectionId));
  };

  const handleExtractData = () => {
    setAnalysisDialogOpen(true);
  };

  const handleExportResult = (worker: Worker) => {
    appDispatch(exportWorkerResultRequest({ worker }));
  };

  const handleRecoverWorker = (worker: Worker) => {
    appDispatch(recoverWorkerRequest(worker));
  };

  const closeAnalysisDialog = (model: DataModel) => {
    setAnalysisDialogOpen(false);

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

  const closeRemoveAnnotationsDialog = (types: ElementType[]) => {
    setRemoveAnnotationsDialogOpen(false);

    if (collectionId !== undefined) {
      appDispatch(removeAnnotationsByScopeRequest({ scope: { collectionId }, types }));
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
      <Dialog open={analysisDialogOpen} onOpenChange={setAnalysisDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('title_generate_data')}</DialogTitle>
            <DialogDescription>{t('description_select_model')}</DialogDescription>
          </DialogHeader>
          <SelectModelForm close={closeAnalysisDialog} collectionId={collectionId} />
        </DialogContent>
      </Dialog>
      <Dialog open={removeAnnotationsDialogOpen} onOpenChange={setRemoveAnnotationsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('title_remove_annotations')}</DialogTitle>
            <DialogDescription>{t('description_remove_annotations')}</DialogDescription>
          </DialogHeader>
          <RemoveAnnotationsForm close={closeRemoveAnnotationsDialog} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CollectionToolbar;
