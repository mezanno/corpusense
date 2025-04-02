import { History } from '@/data/models/History';
import { useAppSelector } from '@/hooks/hooks';

import useManifest from '@/hooks/useManifest';
import { getHistory } from '@/state/selectors/manifests';
import { IIIFExternalWebResource, InternationalString } from '@iiif/presentation-3';
import { Summary, Thumbnail } from '@samvera/clover-iiif/primitives';
import { FileImage } from 'lucide-react';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

const Item = ({ url }: { url: string }) => {
  const { manifest } = useManifest(url);

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

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            key={url}
            to={`/manifest?manifestId=${url}`}
            className='text-wrapping flex cursor-pointer items-center space-x-2 border-b border-gray-200 p-2'
          >
            {thumbnail}
            {label}
          </Link>
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
