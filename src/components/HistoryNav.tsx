import { StoredItemDetails } from '@/data/models/StoredItem';
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

const Item = ({ item }: { item: StoredItemDetails }) => {
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

  const handleDelete = () => {
    dispatch(removeFromHistoryRequest(item.id));
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className='relative'>
            <Link
              key={item.id}
              to={`/manifest?manifestId=${item.id}`}
              className='text-wrapping flex cursor-pointer items-center space-x-2 border-b border-gray-200 p-2'
            >
              {thumbnail}
              <div className='text-left text-xs font-bold text-mezanno-4'>{item.name}</div>
            </Link>
            <button
              className='absolute top-0 right-0 flex items-center justify-center opacity-0 group-hover:opacity-100'
              title={t('btn_delete_from_history')}
            >
              <CircleX className='text-red-400 hover:text-red-800' onClick={handleDelete} />
            </button>
          </div>
        </TooltipTrigger>
        <TooltipContent>{item.id}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const HistoryNav = () => {
  const history: StoredItemDetails[] = useAppSelector(getHistory);

  const historyItems = useMemo(
    () => history.map((item) => <Item key={item.id} item={item} />),
    [history],
  );

  return (
    <nav aria-label='historique' className='h-auto overflow-auto'>
      {historyItems}
    </nav>
  );
};

export default HistoryNav;
