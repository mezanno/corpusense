import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type Props = {
  data: {
    onAdd: () => void;
  };
};

const AddNode = ({ data }: Props) => {
  const { t } = useTranslation();
  return (
    <div
      onClick={data.onAdd}
      className='nodrag nopan flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed bg-white p-8 hover:border-primary'
    >
      <Plus size={32} />
      <span>{t('btn_add_first_modifier')}</span>
    </div>
  );
};

export default AddNode;
