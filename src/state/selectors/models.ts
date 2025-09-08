import { DataField } from '@/data/models/DataModel';
import { RootState } from '../store';

export const selectModels = (state: RootState) => state.models.storedModels;

export const selectModelById = (state: RootState, id: string) =>
  state.models.storedModels.find((model) => model.id === id);

export const selectDatafieldById = (state: RootState, id: string): DataField | null => {
  for (const model of state.models.storedModels) {
    const field = model.fields.find((f) => f.id === id);
    if (field) return field;
  }
  return null;
};
