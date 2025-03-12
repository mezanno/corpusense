import { History } from '@/data/models/History';
import { useAppDispatch, useAppSelector } from '@/hooks/hooks';
import useManifest from '@/hooks/useManifest';
import { fetchManifestFromUrlRequest } from '@/state/reducers/manifests';
import { getHistory } from '@/state/selectors/manifests';
import { IIIFExternalWebResource, InternationalString } from '@iiif/presentation-3';
import { Summary, Thumbnail } from '@samvera/clover-iiif/primitives';
import { FileImage } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

const Item = ({ url }: { url: string }) => {
  const { manifest } = useManifest(url);
  const dispatch = useAppDispatch();

  const thumbnail = useMemo(() => {
    if (manifest !== null && manifest.thumbnail !== undefined) {
      return (
        <Thumbnail
          thumbnail={manifest.thumbnail as IIIFExternalWebResource[]}
          style={{ width: '48px', height: '48px', objectFit: 'contain' }}
        />
      );
    }
    return <FileImage size={48} />;
  }, [manifest]);

  const label = useMemo(() => {
    const text: InternationalString | undefined = manifest?.summary || manifest?.label;

    return (
      <Summary
        className='text-left text-xs font-bold text-mezanno-4'
        summary={text as InternationalString}
      />
    );
  }, [manifest]);

  const handleHistoryClick = useCallback(
    (u: string) => dispatch(fetchManifestFromUrlRequest(u)),
    [dispatch],
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <div
            key={url}
            onClick={() => handleHistoryClick(url)}
            className='text-wrapping flex cursor-pointer items-center space-x-2 border-b border-gray-200 p-2'
          >
            {thumbnail}
            {label}
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
