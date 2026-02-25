import useModifierChainLive from '@/hooks/data/modifiers/useModifierChainLive';
import useDialog from '@/hooks/ui/useDialog';
import { Download, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '../ui/card';
import { ScrollArea, ScrollBar } from '../ui/scroll-area';
import { ModifierChainCard } from './ModifierChainCard';

const ModifierChainDashboard = ({
  selectedChainId,
  setSelectedChainId,
}: {
  selectedChainId: string | null;
  setSelectedChainId: (id: string | null) => void;
}) => {
  const { t } = useTranslation();
  const { openCreateModelDialog, openImportModelDialog } = useDialog();
  const { modifierChains } = useModifierChainLive();

  return (
    <ScrollArea className='space-y-1'>
      <div className='flex space-x-2'>
        <Card className='card-model border-dashed' onClick={openCreateModelDialog}>
          <CardContent className='flex h-full w-full flex-col items-center justify-center text-secondary hover:text-primary'>
            <Plus size={48} />
            <span className='text-center'>{t('btn_create_model')}</span>
          </CardContent>
        </Card>
        <Card className='card-model border-dashed' onClick={openImportModelDialog}>
          <CardContent className='flex h-full w-full flex-col items-center justify-center text-secondary hover:text-primary'>
            <Download size={48} />
            <span className='text-center'>{t('btn_import_model')}</span>
          </CardContent>
        </Card>

        {modifierChains.map((chain) => (
          <ModifierChainCard
            key={chain.id}
            chain={chain}
            setSelectedChainId={setSelectedChainId}
            selectedChainId={selectedChainId}
          />
        ))}
      </div>
      <ScrollBar orientation='horizontal' />
    </ScrollArea>
  );
};

export default ModifierChainDashboard;
