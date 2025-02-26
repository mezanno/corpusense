import { History } from '@/data/models/history';
import { useAppDispatch, useAppSelector } from '@/hooks/hooks';
import useManifest from '@/hooks/useManifest';
import { fetchManifestFromUrlRequest } from '@/state/reducers/manifests';
import { getHistory } from '@/state/selectors/manifests';
import { IIIFExternalWebResource, InternationalString } from '@iiif/presentation-3';
import { Summary, Thumbnail } from '@samvera/clover-iiif/primitives';
import { useCallback, useEffect, useMemo, useState } from 'react';

const Item = ({ url }: { url: string }) => {
  const { manifest } = useManifest(url);
  const [thumbnail, setThumbnail] = useState<IIIFExternalWebResource[]>([]);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (manifest !== null) {
      setThumbnail(manifest.thumbnail as IIIFExternalWebResource[]);
    }
  }, [manifest]);

  const handleHistoryClick = useCallback(
    (u: string) => dispatch(fetchManifestFromUrlRequest(u)),
    [dispatch],
  );

  return (
    <div
      key={url}
      onClick={() => handleHistoryClick(url)}
      className='text-wrapping flex cursor-pointer items-center space-x-2 border-b border-gray-200 p-2'
    >
      <Thumbnail
        thumbnail={thumbnail}
        style={{ width: '48px', height: '48px', objectFit: 'contain' }}
      />
      <Summary
        className='text-xs font-bold text-mezanno-4'
        summary={manifest?.summary as InternationalString}
      />
    </div>
  );
};

const HistoryNav = () => {
  const history: History[] = useAppSelector(getHistory);

  const historyItems = useMemo(
    () => history.map((item) => <Item key={item.url} url={item.url} />),
    [history],
  );

  return historyItems;
};

export default HistoryNav;
