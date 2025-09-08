import { RootState } from '../store';

export const selectConnectedUser = (state: RootState) => state.auth.user;

export const selectAuthStatus = (state: RootState) => state.auth.status;
