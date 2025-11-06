import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Session, User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  status: 'idle' | 'loading' | 'authenticated' | 'unauthenticated' | 'error';
  error?: string;
}

export const authInitialState: AuthState = {
  user: null,
  session: null,
  status: 'idle',
};

export interface LoginPayload {
  email: string;
  password: string;
}

const authSlice = createSlice({
  name: 'auth',
  initialState: authInitialState,
  reducers: {
    loginRequest(state, _action: PayloadAction<LoginPayload>) {
      state.status = 'loading';
    },
    loginSuccess: (state, action: PayloadAction<{ user: User; session: Session }>) => {
      state.user = action.payload.user;
      state.session = action.payload.session;
      state.status = 'authenticated';
    },
    loginFailure: (state, action: PayloadAction<string>) => {
      state.status = 'error';
      state.error = action.payload;
    },
    logoutRequest: (state) => {
      state.user = null;
      state.session = null;
      state.status = 'unauthenticated';
    },
  },
});

export const { loginRequest, loginSuccess, loginFailure, logoutRequest } = authSlice.actions;
export default authSlice.reducer;
