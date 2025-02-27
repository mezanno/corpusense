import { useAppSelector } from '@/hooks/hooks';
import { getManifest } from '@/state/selectors/manifests';
import {
  IIIFExternalWebResource,
  InternationalString,
  Manifest,
  MetadataItem,
} from '@iiif/presentation-3';
import { Label, Metadata, Summary, Thumbnail } from '@samvera/clover-iiif/primitives';
import { useEffect, useState } from 'react';
import Loading from './Loading';
import { NoManifestToShow } from './NothingToShow';
import { ScrollArea, ScrollBar } from './ui/scroll-area';

const ManifestDetails = () => {
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
    return <Loading />;
  }

  return (
    <section
      className='flex h-full w-full flex-col items-center justify-center space-y-2 p-2'
      aria-label='manifest details'
    >
      {error != null && error !== '' && (
        <div className='text-center text-red-500'>Error while loading manifest: {error}</div>
      )}
      {manifest === null ? (
        <NoManifestToShow />
      ) : (
        <div className='flex h-full w-full flex-col items-center space-y-2'>
          <Thumbnail thumbnail={thumbnail} style={{ objectFit: 'contain' }} />
          <Summary
            as='h2'
            className='text-center text-lg font-bold text-mezanno-4'
            summary={manifest?.summary as InternationalString}
          />
          <Label label={manifest?.label} as='h3' className='text-center text-mezanno-4' />
          <h4 className='w-full text-sm font-bold break-words text-mezanno-4'>{manifest?.id}</h4>
          <ScrollArea className='h-72 w-full rounded-md border p-2 whitespace-nowrap'>
            <Metadata metadata={manifest?.metadata as MetadataItem[]} className='overflow-hidden' />
            <ScrollBar orientation='horizontal' />
          </ScrollArea>
        </div>
      )}
    </section>
  );
};

export default ManifestDetails;
