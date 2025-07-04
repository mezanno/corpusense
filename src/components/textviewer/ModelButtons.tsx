import { ArrowRightLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import AlertDialogForm from '../AlertDialogForm';
import CreateModelButton from './CreateModelButton';
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
      <CreateModelButton />
    </div>
  );
};

export default ModelButtons;
