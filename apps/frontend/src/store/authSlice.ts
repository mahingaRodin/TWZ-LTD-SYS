import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { AuthTokens, PublicUser } from '@fire-system/shared-types';
import { clearAuth, loadStoredAuth, saveAuth } from '@/lib/storage';

interface AuthState {
  user: PublicUser | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
}

const stored = loadStoredAuth();

const initialState: AuthState = {
  user: stored.user,
  tokens: stored.tokens,
  isAuthenticated: Boolean(stored.tokens?.accessToken && stored.user),
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(
      state,
      action: PayloadAction<{ user: PublicUser; tokens: AuthTokens }>,
    ) {
      state.user = action.payload.user;
      state.tokens = action.payload.tokens;
      state.isAuthenticated = true;
      saveAuth(action.payload.tokens, action.payload.user);
    },
    setUser(state, action: PayloadAction<PublicUser>) {
      state.user = action.payload;
      if (state.tokens) {
        saveAuth(state.tokens, action.payload);
      }
    },
    logout(state) {
      state.user = null;
      state.tokens = null;
      state.isAuthenticated = false;
      clearAuth();
    },
  },
});

export const { setCredentials, setUser, logout } = authSlice.actions;
export default authSlice.reducer;
