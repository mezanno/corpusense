import { useAlertDialogContext } from '@/components/reducers/useAlertDialogContext';
import ImportModelForm from '@/components/textviewer/ImportModelForm';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';

const useImportModelDialog = () => {
  const { t } = useTranslation();
  const { openDialog } = useAlertDialogContext();
  const formRef = useRef<HTMLFormElement | null>(null);

  const openImportModelDialog = () => {
    openDialog({
      title: t('btn_import_model'),
      children: <ImportModelForm formRef={formRef} />,
      onConfirm: {
        message: t('btn_import_model'),
        action: () => {
          //! La fenêtre se ferme automatiquement, on doit donc déclencher la validation du formulaire manuellement
          formRef.current?.requestSubmit();
        },
      },
    });
  };

  return { openImportModelDialog };
};

export default useImportModelDialog;
