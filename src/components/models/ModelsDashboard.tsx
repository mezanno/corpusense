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
    <ScrollArea className='h-full w-full pr-3'>
      <div className='flex w-full flex-col space-y-2'>
        <div className='flex gap-1'>
          <Card className='card-model w-1/2 border-dashed p-1' onClick={openCreateModelDialog}>
            <CardContent className='flex h-full w-full flex-col items-center justify-center text-secondary hover:text-primary'>
              <Plus size={20} />
              <span className='text-center text-sm'>{t('btn_create_model')}</span>
            </CardContent>
          </Card>
          <Card className='card-model w-1/2 border-dashed' onClick={openImportModelDialog}>
            <CardContent className='flex h-full w-full flex-col items-center justify-center text-secondary hover:text-primary'>
              <Download size={20} />
              <span className='text-center text-sm'>{t('btn_import_model')}</span>
            </CardContent>
          </Card>
        </div>

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
