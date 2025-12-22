import { Collection } from '@/data/models/Collection';
import { useAnnotationActions } from '@/hooks/data/annotations/useAnnotationActions';
import useDialog from '@/hooks/ui/useDialog';
import { Pin } from 'lucide-react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { useWorkerContext } from './reducers/WorkerContext';
import Toolbar from './ToolBar';
import { Toggle } from './ui/toggle';

const CollectionToolbar = memo(function CollectionToolbar({
  collection,
}: {
  collection: Collection;
}) {
  const { t } = useTranslation();
  const { openRemoveAnnotationsDialog } = useDialog();
  const isWorkerRunning = useWorkerContext().isWorkerOrTaskRunning({ collectionId: collection.id });

  const { recomputeRegions } = useAnnotationActions();
  // const [analysisDialogOpen, setAnalysisDialogOpen] = useState(false);

  if (isWorkerRunning) {
    return (
      <div className='panel'>
        <strong>{t('info_worker_running')}</strong>
      </div>
    );
  }

  const handleDeleteAllAnnotations = () => {
    openRemoveAnnotationsDialog({ collectionId: collection.id });
  };

  const handleRecomputeRegions = () => {
    void (async () => {
      await recomputeRegions(collection.id);
    })();
  };

  //TODO! voir comment transmettre des params dynamiques
  // const handleExtractData = () => {
  //   setAnalysisDialogOpen(true);
  // };

  const handleToggleOffline = () => {
    // appDispatch(toggleCollectionOfflineRequest(collection.id));
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
        scope={{ collectionId: collection.id }}
      />
      <div>
        <Toggle
          className='soft-button'
          size={null}
          pressed={!collection.offline}
          onClick={handleToggleOffline}
          disabled={isWorkerRunning}
          title={collection.offline ? t('button_set_online') : t('button_set_offline')}
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
