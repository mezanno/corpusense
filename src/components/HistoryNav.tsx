import { StoredManifestDetails } from '@/data/models/StoredManifest';
import { useAppDispatch, useAppSelector } from '@/hooks/hooks';
import { removeFromHistoryRequest } from '@/state/reducers/manifests';
import { getHistory } from '@/state/selectors/manifests';
import { IIIFExternalWebResource } from '@iiif/presentation-3';
import { Thumbnail } from '@samvera/clover-iiif/primitives';
import { CircleX, FileImage } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

const Item = ({ item }: { item: StoredManifestDetails }) => {
  const dispatch = useAppDispatch();
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
    dispatch(removeFromHistoryRequest(item.id));
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
              <div className='text-left text-xs font-bold text-mezanno-4'>{item.name}</div>
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
  const history: StoredManifestDetails[] = useAppSelector(getHistory);

  return (
    <nav aria-label='historique' className='h-auto overflow-auto'>
      {history.map((item) => (
        <Item key={item.id} item={item} />
      ))}
    </nav>
  );
};

export default HistoryNav;
