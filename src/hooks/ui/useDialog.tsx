import ExportFormatSelectionForm from '@/components/forms/ExportFormatSelectionForm';
import ImportModelForm from '@/components/forms/ImportModelForm';
import LoginForm from '@/components/forms/LoginForm';
import NewCollectionForm from '@/components/forms/NewCollectionForm';
import NewModelForm from '@/components/forms/NewModelForm';
import UploadFileForm from '@/components/forms/UploadFileForm';
import { useAlertDialogContext } from '@/components/reducers/useAlertDialogContext';
import ModelPreview from '@/components/textviewer/ModelPreview';
import { DataModel } from '@/data/models/DataModel';
import { Worker } from '@/data/models/Worker';
import { ReactNode, RefObject } from 'react';
import { useTranslation } from 'react-i18next';

type FormDialogOptions = {
  title: string;
  confirmLabel: string;
  renderForm: (formRef: RefObject<HTMLFormElement | null>) => ReactNode;
};

const useFormDialog = () => {
  const { openDialog } = useAlertDialogContext();
  // const formRef = useRef<HTMLFormElement | null>(null); //! Not to do: Moved inside function to avoid stale ref issue

  const openFormDialog = ({ title, confirmLabel, renderForm }: FormDialogOptions) => {
    const formRef = { current: null } as RefObject<HTMLFormElement | null>; // Create a new ref for each dialog
    openDialog({
      title,
      children: renderForm(formRef),
      onConfirm: {
        message: confirmLabel,
        action: () => formRef.current?.requestSubmit(),
      },
    });
  };

  return { openFormDialog };
};

const useDialog = () => {
  const { t } = useTranslation();
  const { openFormDialog } = useFormDialog();
  const { openDialog } = useAlertDialogContext();

  const openImportCollectionDialog = () => {
    openFormDialog({
      title: t('btn_import_collection'),
      confirmLabel: t('btn_import_collection'),
      renderForm: (formRef) => <UploadFileForm formRef={formRef} />,
    });
  };

  const openNewCollectionDialog = () => {
    openFormDialog({
      title: t('btn_create_collection'),
      confirmLabel: t('btn_create'),
      renderForm: (formRef) => <NewCollectionForm formRef={formRef} />,
    });
  };

  const openSelectFormatDialog = (worker: Worker) => {
    openFormDialog({
      title: t('title_export_worker_result'),
      confirmLabel: t('btn_export'),
      renderForm: (formRef) => <ExportFormatSelectionForm worker={worker} formRef={formRef} />,
    });
  };

  const openLoginDialog = () => {
    openFormDialog({
      title: t('title_login'),
      confirmLabel: t('btn_login'),
      renderForm: (formRef) => <LoginForm formRef={formRef} />,
    });
  };

  const openImportModelDialog = () => {
    openFormDialog({
      title: t('btn_import_model'),
      confirmLabel: t('btn_import_model'),
      renderForm: (formRef) => <ImportModelForm formRef={formRef} />,
    });
  };

  const openCreateModelDialog = () => {
    openFormDialog({
      title: t('btn_create_model'),
      confirmLabel: t('btn_create'),
      renderForm: (formRef) => <NewModelForm formRef={formRef} />,
    });
  };

  const openModelPreviewDialog = (model: DataModel) => {
    openDialog({
      title: t('btn_model_preview'),
      description: t('info_preview_model'),
      children: <ModelPreview model={model} />,
    });
  };

  return {
    openImportCollectionDialog,
    openNewCollectionDialog,
    openSelectFormatDialog,
    openLoginDialog,
    openImportModelDialog,
    openCreateModelDialog,
    openModelPreviewDialog,
  };
};

export default useDialog;
