import { History } from '@/data/models/History';
import { useAppDispatch, useAppSelector } from '@/hooks/hooks';
import useManifest from '@/hooks/useManifest';
import { removeFromHistoryRequest } from '@/state/reducers/manifests';
import { getHistory } from '@/state/selectors/manifests';
import { IIIFExternalWebResource, InternationalString } from '@iiif/presentation-3';
import { Summary, Thumbnail } from '@samvera/clover-iiif/primitives';
import { CircleX, FileImage } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

const Item = ({ url }: { url: string }) => {
  const { manifest } = useManifest(url);
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const label = useMemo(() => {
    const text: InternationalString | undefined = manifest?.summary || manifest?.label;

    return (
      <Summary
        className='text-left text-xs font-bold text-mezanno-4'
        summary={text as InternationalString}
      />
    );
  }, [manifest]);

  const thumbnail = useMemo(() => {
    if (manifest !== null && manifest.thumbnail !== undefined) {
      return (
        <Thumbnail
          thumbnail={manifest.thumbnail as IIIFExternalWebResource[]}
          style={{ width: '48px', height: '48px', objectFit: 'contain' }}
          aria-label='thumbnail'
        />
      );
    }
    return <FileImage size={48} />;
  }, [manifest]);

  const handleDelete = () => {
    dispatch(removeFromHistoryRequest(url));
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className='relative'>
            <Link
              key={url}
              to={`/manifest?manifestId=${url}`}
              className='text-wrapping flex cursor-pointer items-center space-x-2 border-b border-gray-200 p-2'
            >
              {thumbnail}
              {label}
            </Link>
            <button
              className='absolute top-0 right-0 flex items-center justify-center opacity-0 group-hover:opacity-100'
              title={t('btn_delete_from_history')}
            >
              <CircleX className='text-red-400 hover:text-red-800' onClick={handleDelete} />
            </button>
          </div>
        </TooltipTrigger>
        <TooltipContent>{url}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const HistoryNav = () => {
  const history: History[] = useAppSelector(getHistory);

  const historyItems = useMemo(
    () => history.map((item) => <Item key={item.url} url={item.url} />),
    [history],
  );

  return <nav aria-label='historique'>{historyItems}</nav>;
};

export default HistoryNav;
