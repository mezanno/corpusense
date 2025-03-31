import { useAppSelector } from '@/hooks/hooks';
import {
  IIIFExternalWebResource,
  InternationalString,
  Manifest,
  MetadataItem,
} from '@iiif/presentation-3';
import { Label, Metadata, Summary, Thumbnail } from '@samvera/clover-iiif/primitives';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Loading from './Loading';
import './metadata.css';
import MetadataTable from './MetadataTable';
import { NoManifestToShow } from './NothingToShow';
import { ScrollArea, ScrollBar } from './ui/scroll-area';

const ManifestDetails = () => {
  const { isLoading, error, loadedData } = useAppSelector((state) => state.manifests);
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [thumbnail, setThumbnail] = useState<IIIFExternalWebResource[]>([]);
  const { t } = useTranslation();

  useEffect(() => {
    if (loadedData !== null) {
      setThumbnail(loadedData.content.thumbnail as IIIFExternalWebResource[]);
      setManifest(loadedData.content);
    }
  }, [loadedData]);

  if (isLoading) {
    return <Loading />;
  }

  return (
    <section
      className='flex h-full w-full flex-col items-center justify-center space-y-2 p-2'
      aria-label='manifest details'
    >
      {error != null && error !== '' && (
        <h3 className='text-center text-red-500' role='alert'>
          {t('error_loading_manifest')}: {error}
        </h3>
      )}
      {manifest === null ? (
        <NoManifestToShow />
      ) : (
        <div className='flex h-full w-full flex-col items-center space-y-2'>
          <Summary
            as='h2'
            className='text-center text-lg font-bold text-mezanno-4'
            summary={manifest?.summary as InternationalString}
          />
          <Thumbnail thumbnail={thumbnail} />
          <Label label={manifest?.label} as='h3' className='text-center text-mezanno-4' />
          <h4 className='w-full text-sm font-bold break-words text-mezanno-4'>{manifest?.id}</h4>
          <div className='w-full rounded-md border p-2'>
            <h3 className='text-xl'>{t('title_metadata_gallica')}</h3>
            <ScrollArea className='h-72 w-full whitespace-nowrap'>
              <Metadata
                metadata={manifest?.metadata as MetadataItem[]}
                className='overflow-hidden'
              />
              <ScrollBar orientation='horizontal' />
            </ScrollArea>
          </div>
          <div className='w-full rounded-md border p-2'>
            <h3 className='text-xl'>{t('title_metadata_corpusense')}</h3>
            <ScrollArea className='h-72 w-full whitespace-nowrap'>
              <MetadataTable />
              <ScrollBar orientation='horizontal' />
            </ScrollArea>
          </div>
        </div>
      )}
    </section>
  );
};

export default ManifestDetails;
