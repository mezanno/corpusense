import { RootState } from '../store';

export const connectedUser = (state: RootState) => state.auth.user;

export const getAuthStatus = (state: RootState) => state.auth.status;
