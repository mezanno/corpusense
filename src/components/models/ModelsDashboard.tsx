import { useModels } from '@/hooks/data/models/useModels';
import useDialog from '@/hooks/ui/useDialog';
import { Download, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '../ui/card';
import { ScrollArea, ScrollBar } from '../ui/scroll-area';
import { ModelCard } from './ModelCard';

const ModelsDashboard = ({
  selectedModelId,
  setSelectedModelId,
}: {
  selectedModelId: string | null;
  setSelectedModelId: (id: string | null) => void;
}) => {
  const { t } = useTranslation();
  const { openCreateModelDialog, openImportModelDialog } = useDialog();
  const { models } = useModels();

  return (
    <ScrollArea className='h-full space-y-1'>
      <div className='flex flex-col space-y-2'>
        <Card className='card-model border-dashed' onClick={openCreateModelDialog}>
          <CardContent className='flex h-full w-full flex-col items-center justify-center text-secondary hover:text-primary'>
            <Plus size={24} />
            <span className='text-center'>{t('btn_create_model')}</span>
          </CardContent>
        </Card>
        <Card className='card-model border-dashed' onClick={openImportModelDialog}>
          <CardContent className='flex h-full w-full flex-col items-center justify-center text-secondary hover:text-primary'>
            <Download size={24} />
            <span className='text-center'>{t('btn_import_model')}</span>
          </CardContent>
        </Card>

        {models.map((m) => (
          <ModelCard
            key={m.id}
            model={m}
            setSelectedModelId={setSelectedModelId}
            selectedModelId={selectedModelId}
          />
        ))}
      </div>
      <ScrollBar orientation='vertical' />
    </ScrollArea>
  );
};

export default ModelsDashboard;
