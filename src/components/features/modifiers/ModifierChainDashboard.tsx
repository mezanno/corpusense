import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import useModifierChainLive from '@/hooks/data/modifiers/useModifierChainLive';
import { ModifierChainCard } from './ModifierChainCard';

const ModifierChainDashboard = ({
  selectedChainId,
  setSelectedChainId,
}: {
  selectedChainId: string | null;
  setSelectedChainId: (id: string | null) => void;
}) => {
  const { modifierChains } = useModifierChainLive();

  return (
    <ScrollArea className='space-y-1'>
      <div className='flex space-x-2'>
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
