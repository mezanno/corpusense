import { DataField } from '@/data/models/DataModel';
import { useAppDispatch, useAppSelector } from '@/hooks/hooks';
import { addEntityRequest } from '@/state/reducers/namedEntities';
import { getActiveModel } from '@/state/selectors/models';
import { useTranslation } from 'react-i18next';
import { useMarkupContext } from '../reducers/MarkupContext';

const MarkupContextMenu = () => {
  const { t } = useTranslation();
  const model = useAppSelector(getActiveModel);
  const appDispatch = useAppDispatch();
  const { state, dispatch } = useMarkupContext();

  if (!model) {
    return null;
  }

  const fieldButtons = model.fields
    .filter((field) => field.generated !== true)
    .map((field, index) => (
      <button
        key={index}
        className='soft-button'
        style={{ backgroundColor: field.color }}
        color='black'
        onClick={() => handleSetField(field)}
      >
        {field.name}
      </button>
    ))
    .concat(
      <button
        key={-1}
        className='soft-button'
        style={{ backgroundColor: 'white' }}
        color='black'
        onClick={() => handleSetField(undefined)}
      >
        {t('btn_field_clear')}
      </button>,
    );

  const handleSetField = (field: DataField | undefined) => {
    dispatch({ type: 'SET_FIELD_TO_SELECTED', payload: field });

    if (field === undefined) {
      //TODO : remove NamedEntity from store
    } else {
      const selectedWordRects = state.wordRects.filter((_, index) =>
        state.selected.includes(index),
      );
      appDispatch(addEntityRequest({ rects: selectedWordRects, type: field }));
    }
  };

  return (
    <div className='panel shadow'>
      <div className='flex items-center justify-between gap-2'>{fieldButtons}</div>
    </div>
  );
};

export default MarkupContextMenu;
