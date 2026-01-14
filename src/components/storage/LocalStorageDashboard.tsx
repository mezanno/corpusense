import { useConvertedFiles } from '@/hooks/data/convertedFiles/useConvertedFiles';
import useDialog from '@/hooks/ui/useDialog';
import { Archive, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '../ui/card';
import { FileCard } from './FileCard';

const LocalStorageDashboard = () => {
  const { t } = useTranslation();
  const { openConvertPdfForm } = useDialog();
  const { convertedFiles } = useConvertedFiles();
  console.log(convertedFiles);

  return (
    <div>
      <h1 className='flex items-center text-2xl font-bold'>
        <Archive className='mr-2' /> {t('page_title_local_storage')}
      </h1>

      <div className='flex space-x-2'>
        <Card className='card-file border-dashed' onClick={openConvertPdfForm}>
          <CardContent className='flex h-full w-full flex-col items-center justify-center text-secondary hover:text-primary'>
            <Plus size={48} />
            <span className='text-center'>{t('btn_add_pdf')}</span>
          </CardContent>
        </Card>

        {convertedFiles.map((file) => (
          <FileCard key={file.id} file={file} />
        ))}
      </div>
    </div>
  );
};

export default LocalStorageDashboard;
