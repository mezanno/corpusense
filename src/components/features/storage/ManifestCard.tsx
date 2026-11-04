import { useAlertDialogContext } from '@/components/reducers/useAlertDialogContext';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Source } from '@/data/models/source/source';
import useBlob from '@/hooks/data/sources/useBlob';
import useSource from '@/hooks/data/sources/useSource';
import useSources from '@/hooks/data/sources/useSources';
import useDialog from '@/hooks/ui/useDialog';
import useIsDarkImage from '@/hooks/ui/useIsDarkImage';
import useAppNavigation from '@/hooks/useAppNavigation';
import { cn } from '@/lib/utils';
import { ClipboardCopy, Clock, Cloud, Layers, Pen, Trash2, UploadCloud } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ManifestCardProps {
  source: Source;
  isHighlighted: boolean;
}

export function ManifestCard({ source, isHighlighted }: ManifestCardProps) {
  const { t } = useTranslation();
  const { goToManifestExplorer } = useAppNavigation();
  const { openDialog } = useAlertDialogContext();
  const { openOpenManifestDialog, openUploadSourceDialog } = useDialog();
  const { removeSourceFromLibrary } = useSources();
  const { thumbUrl } = useBlob(source.thumbnailBlobId);
  const { sourceWithContent } = useSource(source.id);
  const isDarkImage = useIsDarkImage(thumbUrl);

  const handleRemoveRemoteSource: React.MouseEventHandler<HTMLDivElement> = (event) => {
    event.stopPropagation();
    openDialog({
      title: t('title_are_you_sure'),
      description: t('description_delete_converted_file'),
      onConfirm: {
        message: t('btn_yes'),
        action: () => void removeSourceFromLibrary(source.id),
      },
    });
  };

  const handleUploadToCloud: React.MouseEventHandler<HTMLDivElement> = (event) => {
    event.stopPropagation();
    openUploadSourceDialog({ sourceId: source.id });
  };

  const handleEditRemoteSource: React.MouseEventHandler<HTMLDivElement> = (event) => {
    event.stopPropagation();
    openOpenManifestDialog({ existingSource: sourceWithContent });
  };

  const handleCopyToClipBoard: React.MouseEventHandler<HTMLDivElement> = (event) => {
    event.stopPropagation();
    if (
      sourceWithContent?.content.type === 'local' &&
      sourceWithContent.content.githubManifestUrl !== undefined
    ) {
      void navigator.clipboard.writeText(sourceWithContent.content.githubManifestUrl);
    }
  };

  return (
    <Card
      className={cn(
        'card-file flex min-w-40 flex-col overflow-hidden bg-white',
        isHighlighted && 'border-4 border-primary-foreground',
      )}
      onClick={() => void goToManifestExplorer(source.id)}
      style={{
        backgroundImage: thumbUrl !== null ? `url(${thumbUrl})` : undefined,
        backgroundSize: 'cover', // couvre tout le card
        backgroundPosition: 'center', // centre l'image
        backgroundRepeat: 'no-repeat', // évite la répétition
        cursor: 'pointer',
      }}
    >
      <CardContent
        className={cn(
          'flex min-h-0 flex-1 flex-col items-end justify-end rounded-t-xl p-2',
          isDarkImage
            ? 'bg-dark-slate-gray-500/60 text-eggshell-900'
            : 'bg-eggshell-800/60 text-dark-slate-gray-500',
        )}
        title={source.name}
      >
        <h3 className='font-bold wrap-anywhere'>{source.name}</h3>
        <div className='flex items-center space-x-2 text-sm'>
          <Layers size={14} /> <span>{source.pageCount} Pages</span>
        </div>
        {sourceWithContent?.content.type === 'local' && (
          <>
            <div className='flex items-center space-x-2 text-sm'>
              <Clock size={14} /> <span>{new Date().toLocaleDateString()}</span>
            </div>
            {sourceWithContent.content.githubManifestUrl !== undefined && (
              <div
                className='flex items-center space-x-2 text-sm'
                title={sourceWithContent.content.githubManifestUrl}
                onClick={handleCopyToClipBoard}
              >
                <Cloud size={14} /> <span className='truncate'>{t('info_manifest_online')}</span>
                <ClipboardCopy size={14} />
              </div>
            )}
          </>
        )}
      </CardContent>
      <CardFooter className='flex shrink-0 justify-between rounded-b-xl bg-white p-2'>
        <div
          onClick={handleEditRemoteSource}
          className='cursor-pointer'
          title={t('btn_edit_source')}
        >
          <Pen size={20} className='text-green-400 hover:text-green-600' />
        </div>
        <div
          onClick={handleUploadToCloud}
          title={t('btn_upload_to_cloud')}
          aria-label={t('btn_upload_to_cloud')}
          className='text-blue-400 hover:text-blue-600'
        >
          <UploadCloud size={16} />
        </div>
        <div
          onClick={handleRemoveRemoteSource}
          className='cursor-pointer'
          title={t('btn_delete_source')}
        >
          <Trash2 size={20} className='text-red-400 hover:text-red-600' />
        </div>
      </CardFooter>
    </Card>
  );
}
