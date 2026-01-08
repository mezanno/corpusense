import { ConvertedFile } from '@/data/models/ConvertedFile';
import useConvertedFileIO from '@/hooks/data/convertedFiles/useConvertedFileIO';
import useAppNavigation from '@/hooks/useAppNavigation';
import { Clock, Layers, Trash2 } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAlertDialogContext } from './reducers/useAlertDialogContext';
import { Card, CardContent, CardFooter, CardHeader } from './ui/card';

interface FileCardProps {
  file: ConvertedFile;
}

export function FileCard({ file }: FileCardProps) {
  const { t } = useTranslation();
  const { removeConvertedFile } = useConvertedFileIO();
  const { goToManifestExplorer } = useAppNavigation();
  const { openDialog } = useAlertDialogContext();

  const thumbUrl = useMemo(() => URL.createObjectURL(file.thumbnailBlob), [file.thumbnailBlob]);

  const handleRemoveConvertedFile: React.MouseEventHandler<HTMLDivElement> = (event) => {
    event.stopPropagation();
    openDialog({
      title: t('title_are_you_sure'),
      description: t('description_delete_converted_file'),
      onConfirm: {
        message: t('btn_yes'),
        action: () => void removeConvertedFile(file.id),
      },
    });
  };

  return (
    <Card
      className='card-file flex flex-col overflow-hidden bg-white'
      onClick={() => void goToManifestExplorer({ indexeddbId: file.id })}
      style={{ cursor: 'pointer' }}
    >
      <CardHeader className='overflow-hidden'>
        <img src={thumbUrl} alt={file.title} className='rounded-t-xl object-cover' />
      </CardHeader>
      <CardContent className='flex flex-col justify-center'>
        <h3 className='font-bold' title={file.title}>
          {file.title}
        </h3>
        <div className='flex items-center space-x-2 text-sm'>
          <Layers size={14} /> <span>{file.pageCount} Pages</span>
        </div>
        <div className='flex items-center space-x-2 text-sm'>
          <Clock size={14} /> <span>{new Date(file.timestamp).toLocaleDateString()}</span>
        </div>
      </CardContent>
      <CardFooter className='justify-end' onClick={handleRemoveConvertedFile}>
        <Trash2 size={14} />
      </CardFooter>
    </Card>
  );
}
