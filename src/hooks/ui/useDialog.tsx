import { workerPlugins } from '@/App';
import ContactForm from '@/components/forms/ContactForm';
import ConvertPdfForm from '@/components/forms/ConvertPdfForm';
import DuplicateLayoutForm from '@/components/forms/DuplicateLayoutForm';
import ExportCollectionForm from '@/components/forms/ExportCollectionForm';
import ExportFormatSelectionForm from '@/components/forms/ExportFormatSelectionForm';
import ImportCollectionForm from '@/components/forms/ImportCollectionForm';
import ImportModelForm from '@/components/forms/ImportModelForm';
import LoadModifierChainForm, {
  LoadModifierChainResult,
} from '@/components/forms/LoadModifierChainForm';
import LoginForm from '@/components/forms/LoginForm';
import NewCollectionForm, { NewCollectionFormParams } from '@/components/forms/NewCollectionForm';
import NewModelForm from '@/components/forms/NewModelForm';
import OpenManifestForm from '@/components/forms/OpenManifestForm';
import RemoveAnnotationsForm from '@/components/forms/RemoveAnnotationsForm';
import SaveModifierChainForm from '@/components/forms/SaveModifierChainForm';
import StartWorkerForm from '@/components/forms/StartWorkerForm';
import { useAlertDialogContext } from '@/components/reducers/useAlertDialogContext';
import ModelPreview from '@/components/textviewer/ModelPreview';
import { DataModel } from '@/data/models/DataModel';
import { AnyModifier } from '@/data/models/modifiers/Modifier';
import { CanvasScope, Scope } from '@/data/models/Scope';
import { Worker } from '@/data/models/Worker';
import { ReactNode, RefObject } from 'react';
import { useTranslation } from 'react-i18next';

export type FormProps<TResult = unknown> = {
  formRef: RefObject<HTMLFormElement | null>;
  setCanSubmit: (can: boolean) => void;
  closeDialog?: () => void;
  onResult?: (result: TResult) => void;
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

  const openNewCollectionDialog = (params?: NewCollectionFormParams) => {
    const extraProps =
      params?.selection !== undefined && params.manifestId !== undefined
        ? {
            selection: params.selection,
            manifestId: params.manifestId,
          }
        : {};
    openFormDialog({
      title: t('btn_create_collection'),
      confirmLabel: t('btn_create'),
      renderForm: (formRef) => (
        <NewCollectionForm formRef={formRef} setCanSubmit={setCanSubmit} {...extraProps} />
      ),
    });
  };

  const openSelectFormatDialog = (worker: Worker) => {
    openFormDialog({
      title: t('title_export_worker_result', { name: worker.name }),
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

  const openRemoveAnnotationsDialog = (scope: Scope) => {
    openFormDialog({
      title: t('title_remove_annotations'),
      confirmLabel: t('btn_delete'),
      renderForm: (formRef) => (
        <RemoveAnnotationsForm formRef={formRef} scope={scope} setCanSubmit={setCanSubmit} />
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

  const openExportCollectionDialog = (collectionIds: string[]) => {
    openFormDialog({
      title: t('btn_export_collection'),
      confirmLabel: t('btn_export'),
      renderForm: (formRef) => (
        <ExportCollectionForm
          formRef={formRef}
          collectionIds={collectionIds}
          setCanSubmit={setCanSubmit}
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

  const openConvertPdfDialog = () => {
    openDialog({
      title: t('title_import_pdf'),
      description: t('description_select_pdf'),
      children: <ConvertPdfForm />,
    });
  };

  const openSaveModifierChainDialog = (
    modifiers: AnyModifier[],
    modifiersValues: Record<string, unknown>,
  ) => {
    openFormDialog({
      title: t('btn_save_modifierchain'),
      confirmLabel: t('btn_save'),
      renderForm: (formRef) => (
        <SaveModifierChainForm
          formRef={formRef}
          setCanSubmit={setCanSubmit}
          modifiers={modifiers}
          modifiersValues={modifiersValues}
        />
      ),
    });
  };

  const openLoadModifierChainDialog = (onResult: (result: LoadModifierChainResult) => void) => {
    openFormDialog({
      title: t('btn_load_modifiers'),
      confirmLabel: t('btn_open'),
      renderForm: (formRef) => (
        <LoadModifierChainForm
          formRef={formRef}
          setCanSubmit={setCanSubmit}
          closeDialog={closeDialog}
          onResult={onResult}
        />
      ),
    });
  };

  const openStartWorkerDialog = (workerName: string, scope: Scope) => {
    const plugin = workerPlugins[workerName];
    if (plugin.runtimeParametersSchema === undefined) {
      console.error(`Plugin ${workerName} does not have a runtime parameters schema`);
      return;
    }

    openFormDialog({
      title: `${t('btn_start_analysis')} - ${plugin.info.displayName}`,
      confirmLabel: t('btn_start'),
      renderForm: (formRef) => (
        <StartWorkerForm
          formRef={formRef}
          scope={scope}
          workerName={workerName}
          setCanSubmit={setCanSubmit}
        />
      ),
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
    openExportCollectionDialog,
    openConvertPdfForm: openConvertPdfDialog,
    openSaveModifierChainDialog,
    openLoadModifierChainDialog,
    openStartWorkerDialog,
  };
};

export default useDialog;
