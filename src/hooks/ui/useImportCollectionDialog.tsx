import { useAlertDialogContext } from '@/components/reducers/useAlertDialogContext';
import UploadFileForm from '@/components/UploadFileForm';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';

const useImportCollectionDialog = () => {
  const { t } = useTranslation();
  const { openDialog: showPopup } = useAlertDialogContext();
  const formRef = useRef<HTMLFormElement | null>(null);

  const openImportCollectionDialog = () => {
    showPopup({
      title: t('btn_import_collection'),
      children: <UploadFileForm formRef={formRef} />,
      onConfirm: {
        message: t('btn_import_collection'),
        action: () => {
          //! La fenêtre se ferme automatiquement, on doit donc déclencher la validation du formulaire manuellement
          formRef.current?.requestSubmit();
        },
      },
    });
  };

  return { openImportCollectionDialog };
};

export default useImportCollectionDialog;
