import { RootState } from '../store';

const getAnnotations = (state: RootState) => state.annotations ?? [];

export { getAnnotations };
