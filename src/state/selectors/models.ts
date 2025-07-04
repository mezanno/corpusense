import { DataField } from '@/data/models/DataModel';
import { RootState } from '../store';

export const getActiveModel = (state: RootState) => state.models.activeModel;
export const getModels = (state: RootState) => state.models.storedModels;
export const hasActiveModel = (state: RootState) => state.models.activeModel !== null;
export const getDatafieldById = (state: RootState, id: string): DataField | null => {
  for (const model of state.models.storedModels) {
    const field = model.fields.find((f) => f.id === id);
    if (field) return field;
  }
  return null;
};
