import ModifierChainDashboard from '@/components/modifiers/ModifierChainDashboard';
import ModifierChainFlow from '@/components/modifiers/ModifierChainFlow';
import { ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Container } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const ModifierChainManagerPage = () => {
  const { t } = useTranslation();
  const [selectedChainId, setSelectedChainId] = useState<string | null>(null);

  return (
    <div className='flex h-full w-full flex-col space-y-2 p-4'>
      <h1 className='flex items-center text-2xl font-bold'>
        <Container className='mr-2' /> {t('page_title_modifierchain_manager')}
      </h1>
      <ModifierChainDashboard
        setSelectedChainId={setSelectedChainId}
        selectedChainId={selectedChainId}
      />
      <ResizablePanelGroup direction='horizontal' className='flex-1 space-x-2'>
        <ResizablePanel order={1} id='metadata-panel' className='flex flex-col' minSize={50}>
          {selectedChainId !== null && (
            <div className='flex h-full w-full flex-col'>
              <ModifierChainFlow initialChainId={selectedChainId} />
            </div>
          )}
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default ModifierChainManagerPage;
