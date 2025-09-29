import { Worker } from '@/data/models/Worker';
import { useAppDispatch, useAppSelector } from '@/hooks/hooks';
import useDialog from '@/hooks/ui/useDialog';
import { recomputeRegionsRequest } from '@/state/reducers/annotations';
import { exportTextOfCollectionRequest } from '@/state/reducers/export';
import { selectIsWorkerOrTaskRunning } from '@/state/selectors/workers';
import { useTranslation } from 'react-i18next';
import Toolbar from './ToolBar';

const CollectionToolbar = ({ collectionId }: { collectionId: string }) => {
  const { t } = useTranslation();
  const appDispatch = useAppDispatch();
  const { openSelectFormatDialog, openRemoveAnnotationsDialog } = useDialog();
  const isWorkerRunning = useAppSelector((state) =>
    selectIsWorkerOrTaskRunning(state, { collectionId }),
  );
  // const [analysisDialogOpen, setAnalysisDialogOpen] = useState(false);

  if (isWorkerRunning) {
    return (
      <div className='panel'>
        <strong>{t('info_worker_running')}</strong>
      </div>
    );
  }

  const handleDeleteAllAnnotations = () => {
    openRemoveAnnotationsDialog(collectionId);
  };

  const handleRecomputeRegions = () => {
    appDispatch(recomputeRegionsRequest(collectionId));
  };

  const handleExportText = () => {
    appDispatch(exportTextOfCollectionRequest(collectionId));
  };

  //TODO! voir comment transmettre des params dynamiques
  // const handleExtractData = () => {
  //   setAnalysisDialogOpen(true);
  // };

  const handleExportResult = (worker: Worker) => {
    openSelectFormatDialog(worker);
  };

  // const closeAnalysisDialog = (model: DataModel) => {
  //   setAnalysisDialogOpen(false);

  //   if (collectionId !== undefined) {
  //     appDispatch(
  //       startWorkerProcess({
  //         workerName: 'mistral',
  //         params: {
  //           model,
  //           workerName: 'mistral',
  //         },
  //         scope: { collectionId },
  //       }),
  //     );
  //   }
  // };

  return (
    <div className='panel'>
      <Toolbar
        title={t('title_collection_actions')}
        handleDeleteAllAnnotations={handleDeleteAllAnnotations}
        handleExportText={handleExportText}
        handleRecomputeRegions={handleRecomputeRegions}
        handleExportResult={handleExportResult}
        scope={{ collectionId }}
      />
      {/* <Dialog open={analysisDialogOpen} onOpenChange={setAnalysisDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('title_generate_data')}</DialogTitle>
            <DialogDescription>{t('description_select_model')}</DialogDescription>
          </DialogHeader>
          <SelectModelForm close={closeAnalysisDialog} collectionId={collectionId} />
        </DialogContent>
      </Dialog> */}
    </div>
  );
};

export default CollectionToolbar;
