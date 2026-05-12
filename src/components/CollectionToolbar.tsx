import { Collection } from '@/data/models/Collection';
import { useAnnotationActions } from '@/hooks/data/annotations/useAnnotationActions';
import useDialog from '@/hooks/ui/useDialog';
import { Copy } from 'lucide-react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { IconButtonWithTooltip } from './IconButtonWithTooltip';
import { useWorkerContext } from './reducers/WorkerContext';
import Toolbar from './ToolBar';

const CollectionToolbar = memo(function CollectionToolbar({
  collection,
}: {
  collection: Collection;
}) {
  const { t } = useTranslation();
  const { openRemoveAnnotationsDialog, openDupicateCollectionDialog } = useDialog();
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

  const handleDuplicate = () => {
    openDupicateCollectionDialog(collection);
  };

  return (
    <div className='flex gap-2'>
      <Toolbar
        title={t('title_collection_actions')}
        handleDeleteAllAnnotations={handleDeleteAllAnnotations}
        handleRecomputeRegions={handleRecomputeRegions}
        scope={{ collectionId: collection.id }}
      />
      <IconButtonWithTooltip tooltip={t('btn_duplicate')} onClick={() => void handleDuplicate()}>
        <Copy />
      </IconButtonWithTooltip>
    </div>
  );
});

export default CollectionToolbar;
