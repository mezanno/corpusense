import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import useLiveSources from '@/hooks/data/sources/useLiveSources';
import useDialog from '@/hooks/ui/useDialog';
import { Ellipsis, Globe, Plus } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ManifestCard } from './ManifestCard';

const IIIFSourcesDashboard = () => {
  const { t } = useTranslation();
  const { openOpenManifestDialog } = useDialog();
  const { remoteSources, removeUnusedSources } = useLiveSources();
  const [lastManifestAddedId, setLastManifestAddedId] = useState<string | null>(null);

  const onManifestAdded = (newSourceId: string) => {
    setLastManifestAddedId(newSourceId);
  };

  const handleRemoveUnusedSources = async () => {
    await removeUnusedSources();
  };

  return (
    <div className='flex h-full flex-col'>
      <h1 className='flex items-center gap-2 text-2xl font-bold'>
        <Globe />
        <span>{t('page_title_iiif_storage')}</span>
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Ellipsis className='hover:text-secondary' />
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => void handleRemoveUnusedSources()}>
                {t('btn_remove_unused_sources')}
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </h1>

      <div className='mt-2 flex h-full flex-wrap gap-2 overflow-y-auto'>
        {/* max-h-[70vh] */}
        <Card
          className='card-file border-dashed'
          onClick={() => openOpenManifestDialog({ onResult: onManifestAdded })}
        >
          <CardContent className='flex h-full w-full flex-col items-center justify-center text-secondary hover:text-primary'>
            <Plus size={48} />
            <span className='text-center'>{t('btn_add_pdf')}</span>
          </CardContent>
        </Card>
        {remoteSources.map((source) => (
          <ManifestCard
            key={source.id}
            source={source}
            isHighlighted={source.id === lastManifestAddedId}
          />
        ))}
      </div>
    </div>
  );
};

export default IIIFSourcesDashboard;
