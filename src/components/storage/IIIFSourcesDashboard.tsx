import { useManifests } from '@/hooks/data/manifests/useManifests';
import useDialog from '@/hooks/ui/useDialog';
import { Book, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '../ui/card';
import { ManifestCard } from './ManifestCard';

const IIIFSourcesDashboard = () => {
  const { t } = useTranslation();
  const { openOpenManifestDialog } = useDialog();
  const { historyDetails } = useManifests();

  return (
    <div>
      <h1 className='flex items-center text-2xl font-bold'>
        <Book className='mr-2' /> {t('page_title_iiif_storage')}
      </h1>

      <div className='flex space-x-2'>
        <Card className='card-file border-dashed' onClick={openOpenManifestDialog}>
          <CardContent className='flex h-full w-full flex-col items-center justify-center text-secondary hover:text-primary'>
            <Plus size={48} />
            <span className='text-center'>{t('btn_add_pdf')}</span>
          </CardContent>
        </Card>

        {historyDetails.map((details) => (
          <ManifestCard key={details.id} details={details} />
        ))}
      </div>
    </div>
  );
};

export default IIIFSourcesDashboard;
