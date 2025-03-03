import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface NavigationState {
  redirectTo: string | null;
}

const initialState: NavigationState = {
  redirectTo: '/corpusense',
};

const navigationSlice = createSlice({
  name: 'navigation',
  initialState,
  reducers: {
    navigateTo: (state, action: PayloadAction<string>) => {
      state.redirectTo = action.payload;
    },
    clearNavigation: (state, _action: PayloadAction<void>) => {
      state.redirectTo = null;
    },
  },
});

export const { navigateTo, clearNavigation } = navigationSlice.actions;
export default navigationSlice.reducer;
