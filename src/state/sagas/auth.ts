import { loginFailure, loginRequest, loginSuccess, logoutRequest } from '@/state/reducers/auth';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '@/utils/config';
import { getErrorMessage } from '@/utils/utils';
import { PayloadAction } from '@reduxjs/toolkit';
import { createClient, Session, User } from '@supabase/supabase-js';
import { call, Effect, put, takeLatest } from 'redux-saga/effects';
import { LoginPayload } from '../reducers/auth';
import { pushError } from '../reducers/events';

function* handleLogin(
  action: PayloadAction<LoginPayload>,
): Generator<Effect, void, { data: { user: User; session: Session }; error: Error | null }> {
  try {
    const { email, password } = action.payload;
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const { data, error } = yield call([supabase.auth, supabase.auth.signInWithPassword], {
      email,
      password,
    });
    // console.log('Login data: ', data);
    // console.log('Login error: ', error);

    if (error !== null) {
      yield put(loginFailure(getErrorMessage(error)));
      throw error;
    }

    yield put(loginSuccess({ user: data.user, session: data.session }));
  } catch (err) {
    yield put(loginFailure(getErrorMessage(err)));
    yield put(pushError(getErrorMessage(err)));
  }
}

function* handleLogout(): Generator<Effect, void, { error: Error | null }> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { error } = yield call([supabase.auth, supabase.auth.signOut]);
  if (error !== null) {
    yield put(loginFailure(getErrorMessage(error)));
    throw error;
  }
}

export default function* authSaga() {
  yield takeLatest(loginRequest, handleLogin);
  yield takeLatest(logoutRequest, handleLogout);
}
