import { useAppDispatch, useAppSelector } from '@/hooks/hooks';
import useDialog from '@/hooks/ui/useDialog';
import { recomputeRegionsRequest } from '@/state/reducers/annotations';
import { toggleCollectionOfflineRequest } from '@/state/reducers/collections';
import { selectIsCollectionOffline } from '@/state/selectors/collections';
import { selectIsWorkerOrTaskRunning } from '@/state/selectors/workers';
import { Pin } from 'lucide-react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import Toolbar from './ToolBar';
import { Toggle } from './ui/toggle';

const CollectionToolbar = memo(function CollectionToolbar({
  collectionId,
}: {
  collectionId: string;
}) {
  const { t } = useTranslation();
  const appDispatch = useAppDispatch();
  const { openRemoveAnnotationsDialog } = useDialog();
  const isWorkerRunning = useAppSelector((state) =>
    selectIsWorkerOrTaskRunning(state, { collectionId }),
  );
  const isCollectionOffline = useAppSelector((state) =>
    selectIsCollectionOffline(state, collectionId),
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
    openRemoveAnnotationsDialog({ collectionId });
  };

  const handleRecomputeRegions = () => {
    appDispatch(recomputeRegionsRequest(collectionId));
  };

  //TODO! voir comment transmettre des params dynamiques
  // const handleExtractData = () => {
  //   setAnalysisDialogOpen(true);
  // };

  const handleToggleOffline = () => {
    appDispatch(toggleCollectionOfflineRequest(collectionId));
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
    <div className='panel justify-between'>
      <Toolbar
        title={t('title_collection_actions')}
        handleDeleteAllAnnotations={handleDeleteAllAnnotations}
        handleRecomputeRegions={handleRecomputeRegions}
        scope={{ collectionId }}
      />
      <div>
        <Toggle
          className='soft-button'
          size={null}
          pressed={isCollectionOffline}
          onClick={handleToggleOffline}
          disabled={isWorkerRunning}
          title={isCollectionOffline ? t('button_set_offline') : t('button_set_online')}
        >
          <Pin size={24} />
        </Toggle>
      </div>
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
});

export default CollectionToolbar;
