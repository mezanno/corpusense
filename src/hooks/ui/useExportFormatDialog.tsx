import ExportFormatSelectionForm from '@/components/ExportFormatSelectionForm';
import { usePopupContext } from '@/components/reducers/usePopupContext';
import { Worker } from '@/data/models/Worker';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';

export const useExportFormatDialog = () => {
  const { t } = useTranslation();
  const { openDialog: showPopup } = usePopupContext();
  const formRef = useRef<HTMLFormElement | null>(null);
  const openSelectFormatDialog = (worker: Worker) => {
    showPopup({
      title: t('title_export_worker_result', { name: worker.name }),
      children: <ExportFormatSelectionForm worker={worker} formRef={formRef} />,
      onConfirm() {
        //! La fenêtre se ferme automatiquement, on doit donc déclencher la validation du formulaire manuellement
        formRef.current?.requestSubmit();
      },
      onConfirmMessage: t('btn_export'),
    });
  };

  return { openSelectFormatDialog };
};
