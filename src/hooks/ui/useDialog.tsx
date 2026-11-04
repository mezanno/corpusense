import { workerPlugins } from '@/App';
import ContactForm from '@/components/common/forms/ContactForm';
import ConvertPdfForm from '@/components/common/forms/ConvertPdfForm';
import DuplicateCollectionForm from '@/components/common/forms/DuplicateCollectionForm';
import DuplicateLayoutForm from '@/components/common/forms/DuplicateLayoutForm';
import ExportCollectionForm from '@/components/common/forms/ExportCollectionForm';
import ExportFormatSelectionForm from '@/components/common/forms/ExportFormatSelectionForm';
import ImportCollectionForm from '@/components/common/forms/ImportCollectionForm';
import ImportModelForm from '@/components/common/forms/ImportModelForm';
import LLMProfileForm, { LLMProfileFormValues } from '@/components/common/forms/LLMProfileForm';
import LoadModifierChainForm from '@/components/common/forms/LoadModifierChainForm';
import LoginForm from '@/components/common/forms/LoginForm';
import NewCollectionForm, {
  NewCollectionFormParams,
} from '@/components/common/forms/NewCollectionForm';
import NewModelForm from '@/components/common/forms/NewModelForm';
import NewProjectForm from '@/components/common/forms/NewProjectForm';
import OpenManifestForm from '@/components/common/forms/openManifestForm/OpenManifestForm';
import RemoveAnnotationsForm from '@/components/common/forms/RemoveAnnotationsForm';
import SaveModifierChainForm from '@/components/common/forms/SaveModifierChainForm';
import SelectLlmForm from '@/components/common/forms/SelectLlmForm';
import StartWorkerForm from '@/components/common/forms/StartWorkerForm';
import UpdateSourceNameForm from '@/components/common/forms/UpdateSourceNameForm';
import UploadSourceForm, {
  UploadSourceFormParams,
} from '@/components/common/forms/UploadSourceForm';
import ModelPreview from '@/components/features/models/ModelPreview';
import ModelUsageList from '@/components/features/models/ModelUsageList';
import { useAlertDialogContext } from '@/components/reducers/useAlertDialogContext';
import { CollectionDetails } from '@/data/models/collection/collection';
import { DataModel } from '@/data/models/dataModel/dataModel';
import { LLMProfile } from '@/data/models/LLMProfile';
import { AnyModifier } from '@/data/models/modifiers/Modifier';
import { Project } from '@/data/models/project';
import { CanvasScope, Scope } from '@/data/models/scope/scope';
import { Source, SourceWithContent } from '@/data/models/source/source';
import { Worker } from '@/data/models/worker/worker';
import { ModifierChainData } from '@/data/utils/modifierChain';
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
  confirmLabel?: string;
  cancelLabel?: string;
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
    cancelLabel,
    renderForm,
    closeOnAction,
  }: FormDialogOptions) => {
    const formRef = { current: null } as RefObject<HTMLFormElement | null>; // Create a new ref for each dialog
    openDialog({
      title,
      children: renderForm(formRef, setCanSubmit, closeDialog),
      onConfirm:
        confirmLabel !== undefined
          ? {
              message: confirmLabel,
              action: () => formRef.current?.requestSubmit(),
              closeOnAction,
            }
          : undefined,
      onCancel:
        cancelLabel !== undefined
          ? {
              message: cancelLabel,
              action: () => closeDialog(),
            }
          : undefined,
    });
  };

  const openImportCollectionDialog = () => {
    openFormDialog({
      title: t('btn_import_collection'),
      confirmLabel: t('btn_import_collection'),
      renderForm: (formRef) => (
        <ImportCollectionForm formRef={formRef} setCanSubmit={setCanSubmit} />
      ),
      closeOnAction: false, //ne pas fermer le dialog automatiquement après l'import, pour permettre de voir les logs
    });
  };

  const openNewCollectionDialog = (params?: NewCollectionFormParams) => {
    const extraProps =
      params?.selection !== undefined && params.sourceId !== undefined
        ? {
            selection: params.selection,
            sourceId: params.sourceId,
          }
        : {};
    openFormDialog({
      title: t('btn_create_collection'),
      confirmLabel: t('btn_create'),
      renderForm: (formRef) => (
        <NewCollectionForm
          formRef={formRef}
          setCanSubmit={setCanSubmit}
          {...extraProps}
          closeDialog={closeDialog}
        />
      ),
    });
  };

  const openDupicateCollectionDialog = (collection: CollectionDetails) => {
    openFormDialog({
      title: t('title_duplicate_collection', { name: collection.name }),
      confirmLabel: t('btn_duplicate'),
      renderForm: (formRef) => (
        <DuplicateCollectionForm
          collection={collection}
          formRef={formRef}
          setCanSubmit={setCanSubmit}
        />
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

  const openSelectLLMDialog = (onResult: (llmId: string) => void) => {
    openFormDialog({
      title: t('title_select_llm'),
      confirmLabel: t('btn_start'),
      renderForm: (formRef) => (
        <SelectLlmForm formRef={formRef} setCanSubmit={setCanSubmit} onResult={onResult} />
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

  type OpenManifestDialogOptions = {
    onResult?: (sourceAddedId: string) => void;
    existingSource?: SourceWithContent;
  };

  const openOpenManifestDialog = (options: OpenManifestDialogOptions) => {
    openFormDialog({
      title:
        options.existingSource === undefined ? t('btn_open_manifest') : t('title_rename_source'),
      cancelLabel: t('btn_close'),
      renderForm: (formRef) => (
        <OpenManifestForm
          formRef={formRef}
          setCanSubmit={setCanSubmit}
          closeDialog={closeDialog}
          onResult={options.onResult}
          existingSource={options.existingSource}
        />
      ),
      closeOnAction: false,
    });
  };

  const openConvertPdfDialog = (onResult: (sourceAddedId: string) => void) => {
    openFormDialog({
      title: t('title_import_pdf'),
      // description: t('description_select_pdf'),
      renderForm: (formRef) => (
        <ConvertPdfForm
          formRef={formRef}
          setCanSubmit={setCanSubmit}
          closeDialog={closeDialog}
          onResult={onResult}
        />
      ),
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
      closeOnAction: false, //ne pas fermer le dialog automatiquement après l'export, pour permettre de voir les logs
    });
  };

  const openModelPreviewDialog = (model: DataModel) => {
    openDialog({
      title: t('btn_model_preview'),
      description: t('info_preview_model'),
      children: <ModelPreview model={model} />,
    });
  };

  const openModelUsageList = (model: DataModel) => {
    openDialog({
      title: t('title_model_usage'),
      description: t('info_model_usage'),
      children: <ModelUsageList modelId={model.id} />,
    });
  };

  const openSaveModifierChainDialog = (
    modifiers: AnyModifier[],
    modifiersValues: Record<string, unknown>,
    name?: string,
  ) => {
    openFormDialog({
      title: t('btn_save_modifierchain'),
      confirmLabel: t('btn_save'),
      renderForm: (formRef) => (
        <SaveModifierChainForm
          formRef={formRef}
          setCanSubmit={setCanSubmit}
          modifiers={modifiers}
          modifierValues={modifiersValues}
          name={name}
        />
      ),
    });
  };

  const openLoadModifierChainDialog = (onResult: (result: ModifierChainData) => void) => {
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

  const openUploadSourceDialog = (params: UploadSourceFormParams) => {
    openFormDialog({
      title: t('btn_upload_to_cloud'),
      confirmLabel: t('btn_upload'),
      closeOnAction: false,
      renderForm: (formRef) => (
        <UploadSourceForm
          formRef={formRef}
          setCanSubmit={setCanSubmit}
          {...params}
          closeDialog={closeDialog}
        />
      ),
    });
  };

  const openCreateProjectDialog = (onResult: (project: Project) => void) => {
    openFormDialog({
      title: t('btn_create_project'),
      confirmLabel: t('bnt_create_project'),
      renderForm: (formRef) => (
        <NewProjectForm formRef={formRef} setCanSubmit={setCanSubmit} onResult={onResult} />
      ),
    });
  };

  const openChangeSourceNameDialog = (source: Source, onResult: (result: void) => void) => {
    openFormDialog({
      title: t('title_rename_source'),
      confirmLabel: t('btn_rename'),
      renderForm: (formRef) => (
        <UpdateSourceNameForm
          formRef={formRef}
          setCanSubmit={setCanSubmit}
          source={source}
          onResult={onResult}
        />
      ),
    });
  };

  const openAddLLMProfileDialog = (onResult: (values: LLMProfileFormValues) => void) => {
    openFormDialog({
      title: t('dialog_llm_profile_add'),
      confirmLabel: t('btn_save'),
      renderForm: (formRef) => (
        <LLMProfileForm formRef={formRef} setCanSubmit={setCanSubmit} onResult={onResult} />
      ),
    });
  };

  const openEditLLMProfileDialog = (
    profile: LLMProfile,
    onResult: (values: LLMProfileFormValues) => void,
  ) => {
    openFormDialog({
      title: t('dialog_llm_profile_edit'),
      confirmLabel: t('btn_save'),
      renderForm: (formRef) => (
        <LLMProfileForm
          formRef={formRef}
          setCanSubmit={setCanSubmit}
          onResult={onResult}
          defaultValues={profile}
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
    openModelUsageList,
    openContactUsDialog,
    openDuplicateLayoutDialog,
    openRemoveAnnotationsDialog,
    openExportCollectionDialog,
    openConvertPdfDialog,
    openSaveModifierChainDialog,
    openLoadModifierChainDialog,
    openStartWorkerDialog,
    openDupicateCollectionDialog,
    openUploadSourceDialog,
    openCreateProjectDialog,
    openChangeSourceNameDialog,
    openAddLLMProfileDialog,
    openEditLLMProfileDialog,
    openSelectLLMDialog,
  };
};

export default useDialog;
