import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface NavigationState {
  redirectTo: string;
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
  },
});

export const { navigateTo } = navigationSlice.actions;
export default navigationSlice.reducer;
