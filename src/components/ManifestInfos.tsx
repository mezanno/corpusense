import { ManifestState } from '@/state/reducers/manifests';
import { IIIFExternalWebResource } from '@iiif/presentation-3';
import { ManifestNormalized } from '@iiif/presentation-3-normalized';
import { Label, Metadata, Summary, Thumbnail } from '@samvera/clover-iiif/primitives';
import { FC, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { ScrollArea } from './ui/scroll-area';

const ManifestInfos: FC = () => {
  const { data, error, isLoading } = useSelector((state: ManifestState) => state.manifests);
  const [manifest, setManifest] = useState<ManifestNormalized | null>(null);
  const [thumbnail, setThumbnail] = useState<IIIFExternalWebResource[]>([]);

  useEffect(() => {
    if (data !== null) {
      const t = data.thumbnail as IIIFExternalWebResource[];

      setThumbnail(data.thumbnail as IIIFExternalWebResource[]);
      setManifest(data);
    }
  }, [data]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div className='text-center text-red-500'>Error: {error}</div>;
  }

  return (
    <div className='flex h-full w-full flex-col items-center space-y-2 p-2'>
      <Thumbnail thumbnail={thumbnail} />
      <Summary className='text-center text-lg font-bold' summary={manifest?.summary} />
      <Label label={manifest?.label} as='h3' className='text-center' />
      <h4 className='text-center text-sm font-bold'>{manifest?.id}</h4>
      {manifest && (
        <ScrollArea className='h-72 w-full rounded-md border p-4'>
          <Metadata metadata={manifest?.metadata} />
        </ScrollArea>
      )}
    </div>
  );
};

export default ManifestInfos;
