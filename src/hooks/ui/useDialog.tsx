import ContactForm from '@/components/forms/ContactForm';
import DuplicateLayoutForm from '@/components/forms/DuplicateLayoutForm';
import ExportFormatSelectionForm from '@/components/forms/ExportFormatSelectionForm';
import ImportCollectionForm from '@/components/forms/ImportCollectionForm';
import ImportModelForm from '@/components/forms/ImportModelForm';
import LoginForm from '@/components/forms/LoginForm';
import NewCollectionForm from '@/components/forms/NewCollectionForm';
import NewModelForm from '@/components/forms/NewModelForm';
import OpenManifestForm from '@/components/forms/OpenManifestForm';
import RemoveAnnotationsForm from '@/components/forms/RemoveAnnotationsForm';
import { useAlertDialogContext } from '@/components/reducers/useAlertDialogContext';
import ModelPreview from '@/components/textviewer/ModelPreview';
import { DataModel } from '@/data/models/DataModel';
import { CanvasScope } from '@/data/models/Scope';
import { Worker } from '@/data/models/Worker';
import { ReactNode, RefObject } from 'react';
import { useTranslation } from 'react-i18next';

export type FormProps = {
  formRef: RefObject<HTMLFormElement | null>;
  setCanSubmit: (can: boolean) => void;
  closeDialog?: () => void;
};

type FormDialogOptions = {
  title: string;
  confirmLabel: string;
  renderForm: (
    formRef: RefObject<HTMLFormElement | null>, //référence au formulaire pour pouvoir déclencher le submit
    setCanSubmit: (can: boolean) => void, //indique si le bouton de confirmation doit être actif (en fonction de la validité du formulaire)
    closeDialog?: () => void, //fonction de fermeture du dialog à passer aux formulaires qui en auraient besoin
  ) => ReactNode;
  closeOnAction?: boolean; //Permet de spécifier si le dialog doit se fermer après l'action de confirmation (défaut true)
};

const useDialog = () => {
  const { t } = useTranslation();
  const { openDialog, setCanSubmit, closeDialog } = useAlertDialogContext();
  // const formRef = useRef<HTMLFormElement | null>(null); //! Not to do: Moved inside function to avoid stale ref issue

  //fonction permettant l'ouverture d'un dialog avec un formulaire
  const openFormDialog = ({
    title,
    confirmLabel,
    renderForm,
    closeOnAction,
  }: FormDialogOptions) => {
    const formRef = { current: null } as RefObject<HTMLFormElement | null>; // Create a new ref for each dialog

    openDialog({
      title,
      children: renderForm(formRef, setCanSubmit, closeDialog),
      onConfirm: {
        message: confirmLabel,
        action: () => formRef.current?.requestSubmit(),
        closeOnAction,
      },
    });
  };

  const openImportCollectionDialog = () => {
    openFormDialog({
      title: t('btn_import_collection'),
      confirmLabel: t('btn_import_collection'),
      renderForm: (formRef) => (
        <ImportCollectionForm formRef={formRef} setCanSubmit={setCanSubmit} />
      ),
    });
  };

  const openNewCollectionDialog = () => {
    openFormDialog({
      title: t('btn_create_collection'),
      confirmLabel: t('btn_create'),
      renderForm: (formRef) => <NewCollectionForm formRef={formRef} setCanSubmit={setCanSubmit} />,
    });
  };

  const openSelectFormatDialog = (worker: Worker) => {
    openFormDialog({
      title: t('title_export_worker_result'),
      confirmLabel: t('btn_export'),
      renderForm: (formRef) => (
        <ExportFormatSelectionForm worker={worker} formRef={formRef} setCanSubmit={setCanSubmit} />
      ),
    });
  };

  const openLoginDialog = () => {
    openFormDialog({
      title: t('title_login'),
      confirmLabel: t('btn_login'),
      renderForm: (formRef) => (
        <LoginForm formRef={formRef} setCanSubmit={setCanSubmit} closeDialog={closeDialog} />
      ),
      closeOnAction: false,
    });
  };

  const openOpenManifestDialog = () => {
    openFormDialog({
      title: t('btn_open_manifest'),
      confirmLabel: t('btn_open_manifest'),
      renderForm: (formRef) => (
        <OpenManifestForm formRef={formRef} setCanSubmit={setCanSubmit} closeDialog={closeDialog} />
      ),
      closeOnAction: false,
    });
  };

  const openContactUsDialog = () => {
    openFormDialog({
      title: t('title_contact'),
      confirmLabel: t('btn_send'),
      renderForm: (formRef) => (
        <ContactForm formRef={formRef} setCanSubmit={setCanSubmit} closeDialog={closeDialog} />
      ),
      closeOnAction: false,
    });
  };

  const openImportModelDialog = () => {
    openFormDialog({
      title: t('btn_import_model'),
      confirmLabel: t('btn_import_model'),
      renderForm: (formRef) => (
        <ImportModelForm formRef={formRef} setCanSubmit={setCanSubmit} closeDialog={closeDialog} />
      ),
      closeOnAction: false,
    });
  };

  const openCreateModelDialog = () => {
    openFormDialog({
      title: t('btn_create_model'),
      confirmLabel: t('btn_create'),
      renderForm: (formRef) => <NewModelForm formRef={formRef} setCanSubmit={setCanSubmit} />,
    });
  };

  const openRemoveAnnotationsDialog = (collectionId: string) => {
    openFormDialog({
      title: t('title_remove_annotations'),
      confirmLabel: t('btn_delete'),
      renderForm: (formRef) => (
        <RemoveAnnotationsForm
          formRef={formRef}
          collectionId={collectionId}
          setCanSubmit={setCanSubmit}
        />
      ),
    });
  };

  const openDuplicateLayoutDialog = (scope: CanvasScope) => {
    openFormDialog({
      title: t('btn_duplicate_regions'),
      confirmLabel: t('btn_apply'),
      renderForm: (formRef) => (
        <DuplicateLayoutForm
          formRef={formRef}
          setCanSubmit={setCanSubmit}
          closeDialog={closeDialog}
          scope={scope}
        />
      ),
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
    openOpenManifestDialog,
    openImportCollectionDialog,
    openNewCollectionDialog,
    openSelectFormatDialog,
    openLoginDialog,
    openImportModelDialog,
    openCreateModelDialog,
    openModelPreviewDialog,
    openContactUsDialog,
    openDuplicateLayoutDialog,
    openRemoveAnnotationsDialog,
  };
};

export default useDialog;
