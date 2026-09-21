import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/store/authSlice';
import environment from '../config/environment';

/**
 * Server state lives in React Query; Redux holds only client/session state.
 * Add slices here as features grow - keep them thin.
 */
export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
  devTools: !environment.isProduction,
});

export default store;
