import { Collection } from '@/data/models/Collection';
import { useAnnotationActions } from '@/hooks/data/annotations/useAnnotationActions';
import useDialog from '@/hooks/ui/useDialog';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { useWorkerContext } from './reducers/WorkerContext';
import Toolbar from './ToolBar';

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

  // const handleToggleOffline = () => {
  //   // appDispatch(toggleCollectionOfflineRequest(collection.id));
  // };

  return (
    <div className='panel justify-between'>
      <Toolbar
        title={t('title_collection_actions')}
        handleDeleteAllAnnotations={handleDeleteAllAnnotations}
        handleRecomputeRegions={handleRecomputeRegions}
        scope={{ collectionId: collection.id }}
      />
      {/* <div>
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
      </div> */}
    </div>
  );
});

export default CollectionToolbar;
