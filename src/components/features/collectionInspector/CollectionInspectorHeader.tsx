import CollectionMetadataForm from '@/components/common/forms/CollectionMetadataForm';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import type { Collection } from '@/data/models/collection/collection';
import 'gridstack/dist/gridstack.min.css';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const CollectionInspectorHeader = (collection: Collection) => {
  const { t } = useTranslation();
  const [openPanel, setOpenPanel] = useState<string | undefined>(undefined);

  return (
    <Accordion
      asChild
      className='panel flex-col'
      type='single'
      collapsible
      value={openPanel}
      onValueChange={setOpenPanel}
      // defaultValue='metadata' //this open the metadata by default
    >
      <AccordionItem value='metadata'>
        <AccordionTrigger className='mx-2'>
          <div>
            <h2
              className='flex items-center gap-2 text-lg'
              title={
                openPanel === 'metadata'
                  ? t('info_close_collection_metadata_panel')
                  : t('info_open_collection_metadata_panel')
              }
            >
              {t('title_metadata_collection')}
              <span className='font-bold italic'>{collection.name}</span>
              <span>- {t('info_number_of_items', { number: collection.contentSize })}</span>
            </h2>
            <span className='text-sm font-thin'>({collection.id})</span>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <CollectionMetadataForm collection={collection} />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

export default CollectionInspectorHeader;
