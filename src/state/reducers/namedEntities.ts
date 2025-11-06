import { WordRect } from '@/components/reducers/MarkupContext';
import { DataField } from '@/data/models/DataModel';
import { NamedEntity } from '@/data/models/NamedEntity';
import { CanvasScope } from '@/data/models/Scope';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface AddEntityPayload {
  rects: WordRect[];
  type: DataField;
}

export const entitySlice = createSlice({
  name: 'namedEntities',
  initialState: [] as NamedEntity[],
  reducers: {
    addEntityRequest: (_state, _action: PayloadAction<AddEntityPayload>) => {},
    addEntitySuccess: (state, action: PayloadAction<NamedEntity>) => {
      const newState = state.filter((entity) => entity.id !== action.payload.id);
      newState.push(action.payload);
      return newState;
    },
    loadEntitiesRequest: (_state, _action: PayloadAction<CanvasScope>) => {},
    loadEntitiesSuccess: (_state, action: PayloadAction<NamedEntity[]>) => {
      return action.payload;
    },
  },
});
export const { addEntityRequest, addEntitySuccess, loadEntitiesRequest, loadEntitiesSuccess } =
  entitySlice.actions;
export default entitySlice.reducer;
