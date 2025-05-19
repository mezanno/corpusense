import { DataField } from '@/data/models/DataModel';
import { useAppSelector } from '@/hooks/hooks';
import { getActiveModel } from '@/state/selectors/models';
import { useMarkupContext } from './reducers/MarkupContext';

const MarkupContextMenu = () => {
  const model = useAppSelector(getActiveModel);
  const { dispatch } = useMarkupContext();

  if (!model) {
    return null;
  }

  const handleSetField = (field: DataField) => {
    dispatch({ type: 'SET_FIELD_TO_SELECTED', payload: field });
  };

  return (
    <div className='panel shadow'>
      <div className='flex items-center justify-between gap-2'>
        {model.fields.map((field, index) => (
          <button
            key={index}
            className='soft-button'
            style={{ backgroundColor: field.color }}
            color='black'
            onClick={() => handleSetField(field)}
          >
            {field.name}
          </button>
        ))}
        <div>Autre</div>
      </div>
    </div>
  );
};

export default MarkupContextMenu;
