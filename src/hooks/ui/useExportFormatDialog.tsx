import ExportFormatSelectionForm from '@/components/ExportFormatSelectionForm';
import { useAlertDialogContext } from '@/components/reducers/useAlertDialogContext';
import { Worker } from '@/data/models/Worker';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';

export const useExportFormatDialog = () => {
  const { t } = useTranslation();
  const { openDialog } = useAlertDialogContext();
  const formRef = useRef<HTMLFormElement | null>(null);
  const openSelectFormatDialog = (worker: Worker) => {
    openDialog({
      title: t('title_export_worker_result', { name: worker.name }),
      children: <ExportFormatSelectionForm worker={worker} formRef={formRef} />,
      onConfirm: {
        message: t('btn_export'),
        action: () => {
          //! La fenêtre se ferme automatiquement, on doit donc déclencher la validation du formulaire manuellement
          formRef.current?.requestSubmit();
        },
      },
    });
  };

  return { openSelectFormatDialog };
};
