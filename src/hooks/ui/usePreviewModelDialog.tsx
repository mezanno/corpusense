import { useAlertDialogContext } from '@/components/reducers/useAlertDialogContext';
import ModelPreview from '@/components/textviewer/ModelPreview';
import { DataModel } from '@/data/models/DataModel';
import { useTranslation } from 'react-i18next';

const usePreviewModelDialog = () => {
  const { t } = useTranslation();
  const { openDialog: showPopup } = useAlertDialogContext();

  const openPreviewModelDialog = (model: DataModel) => {
    showPopup({
      title: t('btn_model_preview'),
      description: t('info_preview_model'),
      children: <ModelPreview model={model} />,
    });
  };

  return { openPreviewModelDialog };
};

export default usePreviewModelDialog;
