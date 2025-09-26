import { ElementType } from '@/data/models/Annotation';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

type ElementTypeFilter = {
  type: ElementType;
  selected: boolean;
};

const RemoveAnnotationsForm = ({ close }: { close: (types: ElementType[]) => void }) => {
  const { t } = useTranslation();
  const [filters, setFilters] = useState<ElementTypeFilter[]>(
    Object.values(ElementType).map((type) => ({
      type,
      selected: true,
    })),
  );

  const handleDelete = () => {
    close(filters.filter((f) => f.selected).map((f) => f.type));
  };

  return (
    <div>
      <div className='mb-4 flex flex-wrap gap-4'>
        {filters.map((filter, index) => (
          <div key={filter.type} className='mb-2 items-center space-x-1'>
            <input
              type='checkbox'
              checked={filter.selected}
              onChange={() => {
                const newFilters = [...filters];
                newFilters[index].selected = !newFilters[index].selected;
                setFilters(newFilters);
              }}
            />
            <label>{filter.type}</label>
          </div>
        ))}
      </div>
      <button className='soft-button' title={t('btn_delete')} onClick={handleDelete}>
        {t('btn_delete')}
      </button>
    </div>
  );
};

export default RemoveAnnotationsForm;
