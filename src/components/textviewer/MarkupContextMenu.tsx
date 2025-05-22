import { DataField } from '@/data/models/DataModel';
import { useAppDispatch, useAppSelector } from '@/hooks/hooks';
import { addEntityRequest } from '@/state/reducers/namedEntities';
import { getActiveModel } from '@/state/selectors/models';
import { useMarkupContext } from '../reducers/MarkupContext';

const MarkupContextMenu = () => {
  const model = useAppSelector(getActiveModel);
  const appDispatch = useAppDispatch();
  const { state, dispatch } = useMarkupContext();

  if (!model) {
    return null;
  }

  const handleSetField = (field: DataField) => {
    dispatch({ type: 'SET_FIELD_TO_SELECTED', payload: field });

    const selectedWordRects = state.wordRects.filter((_, index) => state.selected.includes(index));
    appDispatch(addEntityRequest({ rects: selectedWordRects, type: field }));
  };

  return (
    <div className='panel shadow'>
      <div className='flex items-center justify-between gap-2'>
        {model.fields.map(
          (field, index) =>
            field.generated !== true && (
              <button
                key={index}
                className='soft-button'
                style={{ backgroundColor: field.color }}
                color='black'
                onClick={() => handleSetField(field)}
              >
                {field.name}
              </button>
            ),
        )}
      </div>
    </div>
  );
};

export default MarkupContextMenu;
