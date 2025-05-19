import { RootState } from '../store';

export const getActiveModel = (state: RootState) => state.models.activeModel;
export const getModels = (state: RootState) => state.models.storedModels;
