import NewModelForm from '@/components/NewModelForm';
import { useAlertDialogContext } from '@/components/reducers/useAlertDialogContext';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';

const useCreateModelDialog = () => {
  const { t } = useTranslation();
  const { openDialog } = useAlertDialogContext();
  const formRef = useRef<HTMLFormElement | null>(null);

  const openCreateModelDialog = () => {
    openDialog({
      title: t('btn_create_model'),
      children: <NewModelForm formRef={formRef} />,
      onConfirm: {
        message: t('btn_create'),
        action: () => {
          //! La fenêtre se ferme automatiquement, on doit donc déclencher la validation du formulaire manuellement
          formRef.current?.requestSubmit();
        },
      },
    });
  };

  return { openCreateModelDialog };
};

export default useCreateModelDialog;
