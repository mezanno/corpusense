import { StoredManifestDetails } from '@/data/models/StoredManifest';
import { useManifests } from '@/hooks/data/manifests/useManifests';
import { IIIFExternalWebResource } from '@iiif/presentation-3';
import { Thumbnail } from '@samvera/clover-iiif/primitives';
import { CircleX, FileImage } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

const Item = ({
  item,
  removeFromHistory,
}: {
  item: StoredManifestDetails;
  removeFromHistory: (url: string) => Promise<void>;
}) => {
  const { t } = useTranslation();

  const thumbnail = useMemo(() => {
    if (item.thumbnail !== undefined) {
      return (
        <Thumbnail
          thumbnail={[item.thumbnail] as IIIFExternalWebResource[]}
          style={{ width: '48px', height: '48px', objectFit: 'contain' }}
          aria-label='thumbnail'
        />
      );
    }
    return <FileImage size={48} />;
  }, [item]);

  const handleDelete = (event: React.MouseEvent<HTMLElement, MouseEvent>) => {
    event.stopPropagation();
    void (async () => {
      await removeFromHistory(item.id);
    })();
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className='flex cursor-pointer items-center justify-center p-1'>
            <Link
              key={item.id}
              to={`/manifest?manifestId=${item.id}`}
              className='text-wrapping flex items-center space-x-2 border-b border-gray-200 p-1'
            >
              {thumbnail}
              <div className='text-mezanno-4 text-left text-xs font-bold'>{item.name}</div>
            </Link>
            <button title={t('btn_delete_from_history')} onClick={(event) => handleDelete(event)}>
              <CircleX className='text-red-400 hover:text-red-800' />
            </button>
          </div>
        </TooltipTrigger>
        <TooltipContent>{item.id}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const HistoryNav = () => {
  const { historyDetails, removeFromHistory } = useManifests();

  return (
    <nav aria-label='historique' className='h-auto overflow-auto'>
      {historyDetails.map((item) => (
        <Item key={item.id} item={item} removeFromHistory={removeFromHistory} />
      ))}
    </nav>
  );
};

export default HistoryNav;
