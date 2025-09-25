import LoginForm from '@/components/auth/LoginForm';
import { useAlertDialogContext } from '@/components/reducers/useAlertDialogContext';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';

export const useLoginDialog = () => {
  const { t } = useTranslation();
  const { openDialog: showPopup } = useAlertDialogContext();
  const formRef = useRef<HTMLFormElement | null>(null);

  const openSelectFormatDialog = () => {
    showPopup({
      title: t('title_login'),
      children: <LoginForm formRef={formRef} />,
      onConfirm: {
        message: t('btn_login'),
        action: () => {
          //! La fenêtre se ferme automatiquement, on doit donc déclencher la validation du formulaire manuellement
          formRef.current?.requestSubmit();
        },
      },
    });
  };

  return { openSelectFormatDialog };
};
