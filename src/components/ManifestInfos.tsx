import { useAppSelector } from '@/hooks/hooks';
import { getManifest } from '@/state/selectors/manifests';
import {
  IIIFExternalWebResource,
  InternationalString,
  Manifest,
  MetadataItem,
} from '@iiif/presentation-3';
import { Label, Metadata, Summary, Thumbnail } from '@samvera/clover-iiif/primitives';
import { FC, useEffect, useState } from 'react';
import { ScrollArea } from './ui/scroll-area';

const ManifestInfos: FC = () => {
  const { data, error, isLoading } = useAppSelector(getManifest);
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [thumbnail, setThumbnail] = useState<IIIFExternalWebResource[]>([]);

  useEffect(() => {
    if (data !== null) {
      setThumbnail(data.thumbnail as IIIFExternalWebResource[]);
      setManifest(data);
    }
  }, [data]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error != null) {
    return <div className='text-center text-red-500'>Error: {error}</div>;
  }

  return (
    <div className='flex h-full w-full flex-col items-center space-y-2 p-2'>
      <Thumbnail thumbnail={thumbnail} />
      <Summary
        className='text-center text-lg font-bold'
        summary={manifest?.summary as InternationalString}
      />
      <Label label={manifest?.label as InternationalString} as='h3' className='text-center' />
      <h4 className='text-center text-sm font-bold'>{manifest?.id}</h4>
      {manifest && (
        <ScrollArea className='h-72 w-full rounded-md border p-4'>
          <Metadata metadata={manifest?.metadata as MetadataItem[]} />
        </ScrollArea>
      )}
    </div>
  );
};

export default ManifestInfos;
