import { IconButtonWithTooltip } from '@/components/common/IconButtonWithTooltip';
import Toolbar from '@/components/common/ToolBar';
import { Collection } from '@/data/models/collection/collection';
import { useAnnotationActions } from '@/hooks/data/annotations/useAnnotationActions';
import useDialog from '@/hooks/ui/useDialog';
import { Copy, DownloadIcon } from 'lucide-react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

const CollectionToolbar = memo(function CollectionToolbarFunc({
  collection,
}: {
  collection: Collection;
}) {
  const { t } = useTranslation();
  const { openRemoveAnnotationsDialog, openDupicateCollectionDialog, openExportCollectionDialog } =
    useDialog();

  const { recomputeRegions } = useAnnotationActions();

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

  const handleExport = () => {
    openExportCollectionDialog([collection.id]);
  };

  return (
    <div className='flex gap-2'>
      <Toolbar
        handleDeleteAllAnnotations={handleDeleteAllAnnotations}
        handleRecomputeRegions={handleRecomputeRegions}
        scope={{ collectionId: collection.id }}
      />
      <IconButtonWithTooltip tooltip={t('btn_duplicate')} onClick={() => void handleDuplicate()}>
        <Copy />
      </IconButtonWithTooltip>
      <button
        className='soft-button'
        onClick={handleExport}
        aria-label={t('btn_export_collection')}
        title={t('btn_export_collection')}
      >
        <DownloadIcon />
      </button>
    </div>
  );
});

export default CollectionToolbar;
