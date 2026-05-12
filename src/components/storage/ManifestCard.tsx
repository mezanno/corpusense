import { StoredManifestDetails } from '@/data/models/StoredManifest';
import { useManifests } from '@/hooks/data/manifests/useManifests';
import useAppNavigation from '@/hooks/useAppNavigation';
import { IIIFExternalWebResource } from '@iiif/presentation-3';
import { Thumbnail } from '@samvera/clover-iiif/primitives';
import { FileImage, Trash2 } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAlertDialogContext } from '../reducers/useAlertDialogContext';
import { Card, CardContent, CardFooter, CardHeader } from '../ui/card';

interface ManifestCardProps {
  details: StoredManifestDetails;
}

export function ManifestCard({ details }: ManifestCardProps) {
  const { t } = useTranslation();
  const { goToManifestExplorer } = useAppNavigation();
  const { openDialog } = useAlertDialogContext();
  const { removeFromHistory } = useManifests();

  const thumbnail = useMemo(() => {
    if (details.thumbnail !== undefined) {
      return (
        <Thumbnail
          thumbnail={[details.thumbnail] as IIIFExternalWebResource[]}
          style={{ objectFit: 'cover' }}
          aria-label='thumbnail'
        />
      );
    }
    return <FileImage size={48} />;
  }, [details]);

  const handleRemoveConvertedFile: React.MouseEventHandler<HTMLDivElement> = (event) => {
    event.stopPropagation();
    openDialog({
      title: t('title_are_you_sure'),
      description: t('description_delete_converted_file'),
      onConfirm: {
        message: t('btn_yes'),
        action: () => void removeFromHistory(details.id),
      },
    });
  };

  return (
    <Card
      className='card-file flex flex-col overflow-hidden bg-white'
      onClick={() => void goToManifestExplorer({ manifestId: details.id })}
      style={{ cursor: 'pointer' }}
    >
      <CardHeader className='overflow-hidden'>
        {/* <img src={thumbUrl} alt={file.title} className='rounded-t-xl object-cover' /> */}
        {thumbnail}
      </CardHeader>
      <CardContent className='flex flex-col justify-center'>
        <h3 className='font-bold' title={details.name}>
          {details.name}
        </h3>
      </CardContent>
      <CardFooter
        title={t('btn_delete')}
        aria-label={t('btn_delete')}
        className='cursor-pointer justify-end text-red-400 hover:text-red-600'
        onClick={handleRemoveConvertedFile}
      >
        <Trash2 size={14} />
      </CardFooter>
    </Card>
  );
}
