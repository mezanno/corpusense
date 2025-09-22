import {
  IIIFExternalWebResource,
  InternationalString,
  Manifest,
  MetadataItem,
} from '@iiif/presentation-3';
import { Label, Metadata, Summary, Thumbnail } from '@samvera/clover-iiif/primitives';
import { useTranslation } from 'react-i18next';
import './metadata.css';
import MetadataTable from './MetadataTable';
import { ScrollArea, ScrollBar } from './ui/scroll-area';

const ManifestDetails = ({ manifest }: { manifest: Manifest }) => {
  const { t } = useTranslation();

  const thumbnail = manifest?.thumbnail as IIIFExternalWebResource[] | undefined;

  return (
    <section
      className='flex h-full w-full flex-col items-center justify-center space-y-2 p-2'
      aria-label='manifest details'
    >
      <div className='flex h-full w-full flex-col items-center space-y-2'>
        <Summary
          as='h2'
          className='text-center text-lg font-bold'
          summary={manifest.summary as InternationalString}
        />
        {thumbnail !== undefined && <Thumbnail thumbnail={thumbnail} />}
        <Label label={manifest.label ?? { none: [''] }} as='h3' className='text-center' />
        <h4 className='w-full text-sm font-bold break-words'>{manifest.id}</h4>
        <section className='w-full rounded-md border p-2' aria-labelledby='metadata_gallica'>
          <h3 id='metadata_gallica' className='text-xl'>
            {t('title_metadata_gallica')}
          </h3>
          <ScrollArea className='h-72 w-full whitespace-nowrap'>
            <Metadata metadata={manifest.metadata as MetadataItem[]} className='overflow-hidden' />
            <ScrollBar orientation='horizontal' />
          </ScrollArea>
        </section>
        <section className='w-full rounded-md border p-2' aria-labelledby='metadata_corpusense'>
          <h3 id='metadata_corpusense' className='text-xl'>
            {t('title_metadata_corpusense')}
          </h3>
          <ScrollArea className='h-72 w-full whitespace-nowrap'>
            <MetadataTable manifestId={manifest.id} />
            <ScrollBar orientation='horizontal' />
          </ScrollArea>
        </section>
      </div>
    </section>
  );
};

export default ManifestDetails;
