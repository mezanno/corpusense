import NewCollectionForm from '@/components/NewCollectionForm';
import { useAlertDialogContext } from '@/components/reducers/useAlertDialogContext';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';

const useNewCollectionDialog = () => {
  const { t } = useTranslation();
  const { openDialog } = useAlertDialogContext();
  const formRef = useRef<HTMLFormElement | null>(null);

  const openNewCollectionDialog = () => {
    openDialog({
      title: t('btn_create_collection'),
      children: <NewCollectionForm formRef={formRef} />,
      onConfirm: {
        message: t('btn_create'),
        action: () => {
          //! La fenêtre se ferme automatiquement, on doit donc déclencher la validation du formulaire manuellement
          formRef.current?.requestSubmit();
        },
      },
    });
  };

  return { openNewCollectionDialog };
};

export default useNewCollectionDialog;
