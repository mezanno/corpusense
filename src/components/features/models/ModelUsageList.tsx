import { useAlertDialogContext } from '@/components/reducers/useAlertDialogContext';
import { useCollections } from '@/hooks/data/collections/useCollections';
import useAppNavigation from '@/hooks/useAppNavigation';
import { useTranslation } from 'react-i18next';

const ModelUsageList = ({ modelId }: { modelId: string }) => {
  const { t } = useTranslation();
  const { collections } = useCollections();
  const { closeDialog } = useAlertDialogContext();
  const navigation = useAppNavigation();

  const usingCollections = collections.filter((c) => c.modelId === modelId);

  if (usingCollections.length === 0) {
    return <div>{t('info_model_not_used')}</div>;
  }

  const handleSelect = (collectionId: string) => {
    closeDialog();
    void navigation.goToCollectionInspector(collectionId);
  };

  return (
    <ul className='flex max-h-80 flex-col gap-1 overflow-y-auto'>
      {usingCollections.map((collection) => (
        <li key={collection.id}>
          <button
            className='soft-button w-full justify-start text-left'
            onClick={() => handleSelect(collection.id)}
          >
            {collection.name}
          </button>
        </li>
      ))}
    </ul>
  );
};

export default ModelUsageList;
