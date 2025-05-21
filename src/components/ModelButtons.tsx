import { ArrowRightLeft, Grid2X2Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import AlertDialogForm from './AlertDialogForm';
import NewModelForm from './NewModelForm';
import SelectModelForm from './SelectModelForm';

const ModelButtons = () => {
  const { t } = useTranslation();
  return (
    <div className='flex items-center space-x-2'>
      <AlertDialogForm
        title={t('btn_select_model')}
        description={t('form_description_select_model')}
        trigger={<ArrowRightLeft />}
      >
        {({ close }) => <SelectModelForm close={close} />}
      </AlertDialogForm>
      <AlertDialogForm
        title={t('btn_create_model')}
        description={t('form_description_create_model')}
        trigger={<Grid2X2Plus />}
      >
        {({ close }) => <NewModelForm close={close} />}
      </AlertDialogForm>
    </div>
  );
};

export default ModelButtons;
