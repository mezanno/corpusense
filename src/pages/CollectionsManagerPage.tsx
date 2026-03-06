import CollectionTable from '@/components/collectionPage/CollectionTable';
import { useCollections } from '@/hooks/data/collections/useCollections';
import useDialog from '@/hooks/ui/useDialog';
import { FilePlus, Import } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const CollectionsManagerPage = () => {
  const { t } = useTranslation();
  const { collections } = useCollections();
  const { openImportCollectionDialog, openNewCollectionDialog } = useDialog();

  const handleNewCollection = () => {
    openNewCollectionDialog();
  };

  return (
    <div className='panel flex-col items-center space-y-4'>
      <section className='mt-2 ml-4 flex w-full justify-center space-x-2'>
        <button
          className='soft-button'
          title={t('btn_create_collection')}
          onClick={handleNewCollection}
        >
          <FilePlus />
          {t('btn_create_collection')}
        </button>
        <button
          className='soft-button'
          title={t('btn_import_collection')}
          onClick={openImportCollectionDialog}
        >
          <Import />
          {t('btn_import_collection')}
        </button>
      </section>

      {collections.length > 0 ? (
        <section className='flex h-full w-4/5 flex-col items-center space-y-1'>
          <h2 className='text-xl'>
            {t('info_number_of_collections', { number: collections.length })}
          </h2>
          <CollectionTable />
        </section>
      ) : (
        <div role='alert' className='text-2xl'>
          {t('info_no_collection')}
        </div>
      )}
    </div>
  );
};

export default CollectionsManagerPage;
