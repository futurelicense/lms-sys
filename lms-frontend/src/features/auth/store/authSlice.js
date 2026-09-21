import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import authService from '../services/authService';
import tokenStorage from '../../../services/storage/tokenStorage';
import { normalizeError, categorizeAuthError } from '../../../utils/errorUtils';
import {
  clearDemoSession,
  establishDemoSession,
  isDemoSessionActive,
  readDemoSession,
} from '../services/demoSession';

/**
 * Real backend LoginResponse shape (after ApiResponse unwrapping):
 * {
 *   tokens: { accessToken, refreshToken },
 *   user:   { id, name, email, roles: Set<String>, active, locked, ... },
 *   mustChangePassword: boolean
 * }
 *
 * CurrentUserResponse shape (after ApiResponse unwrapping):
 * {
 *   user:        { id, name, email, ... },
 *   roles:       Set<String>,
 *   permissions: Set<String>
 * }
 */

// ─── Thunks ───────────────────────────────────────────────────────────────────

export const login = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    clearDemoSession();
    // Real backend call — response is LoginResponse { tokens, user, mustChangePassword }
    const data = await authService.login(credentials);
    tokenStorage.setTokens(data.tokens);

    // Fetch full profile and permissions so navigation and access guards work immediately
    let meData = null;
    if (!data.mustChangePassword && typeof authService.getCurrentUser === 'function') {
      try {
        meData = await authService.getCurrentUser();
      } catch {
        // Fall back gracefully if getCurrentUser fails or is not mocked in tests
      }
    }

    const baseUser = meData?.user ?? data.user;
    const user = {
      ...baseUser,
      fullName: baseUser?.name,
      roles: Array.isArray(meData?.roles)
        ? meData.roles
        : Array.isArray(data.user?.roles)
          ? data.user.roles
          : [...(data.user?.roles ?? [])],
      permissions: Array.isArray(meData?.permissions)
        ? meData.permissions
        : [...(data.user?.permissions ?? [])],
      mustChangePassword: data.mustChangePassword ?? false,
    };
    return user;
  } catch (error) {
    const authError = categorizeAuthError(error);
    return rejectWithValue(authError);
  }
});

export const loadSession = createAsyncThunk('auth/loadSession', async (_, { rejectWithValue }) => {
  try {
    // Restore offline demo session (survives tab reloads within sessionStorage).
    const demo = readDemoSession();
    if (demo?.user) {
      const restored = establishDemoSession(
        demo.roleKey ??
          (demo.user.roles?.includes('ADMIN')
            ? 'ADMIN'
            : demo.user.roles?.includes('INSTRUCTOR')
              ? 'INSTRUCTOR'
              : 'STUDENT'),
      );
      return restored;
    }

    if (!tokenStorage.getAccessToken()) return null;

    // Real backend — GET /auth/me → CurrentUserResponse { user, roles, permissions }
    const data = await authService.getCurrentUser();
    return {
      ...data.user,
      fullName: data.user?.name,
      roles: Array.isArray(data.roles) ? data.roles : [...(data.roles ?? [])],
      permissions: Array.isArray(data.permissions)
        ? data.permissions
        : [...(data.permissions ?? [])],
      mustChangePassword: false, // If they can call /auth/me they've already set their password
    };
  } catch (error) {
    tokenStorage.clear();
    clearDemoSession();
    return rejectWithValue(normalizeError(error));
  }
});

/** Offline demo login — no API call. Dev/showcase only. */
export const loginDemo = createAsyncThunk('auth/loginDemo', async (roleKey) => {
  clearDemoSession();
  return establishDemoSession(roleKey);
});

export const logout = createAsyncThunk('auth/logout', async (_) => {
  const wasDemo = isDemoSessionActive();
  try {
    if (!wasDemo) {
      const refreshToken = tokenStorage.getRefreshToken();
      await authService.logout(refreshToken ? { refreshToken } : undefined);
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('Backend offline during logout. Cleared session client-side.');
    }
  } finally {
    clearDemoSession();
    tokenStorage.clear();
  }
});

/**
 * Accepts the magic-link invitation token.
 * On success the backend returns a full LoginResponse, so the user
 * is immediately authenticated — no separate login step needed.
 */
export const acceptInvitation = createAsyncThunk(
  'auth/acceptInvitation',
  async ({ token, newPassword }, { rejectWithValue }) => {
    try {
      const data = await authService.acceptInvitation({ token, newPassword });
      tokenStorage.setTokens(data.tokens);
      return {
        ...data.user,
        fullName: data.user?.name,
        roles: Array.isArray(data.user?.roles) ? data.user.roles : [...(data.user?.roles ?? [])],
        permissions: Array.isArray(data.user?.permissions)
          ? data.user.permissions
          : [...(data.user?.permissions ?? [])],
        mustChangePassword: false,
      };
    } catch (error) {
      return rejectWithValue(normalizeError(error));
    }
  },
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const initialState = {
  user: null,
  status: 'idle', // idle | loading | authenticated | unauthenticated
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    sessionExpired(state) {
      state.user = null;
      state.status = 'unauthenticated';
      state.error = null;
    },
    clearAuthError(state) {
      state.error = null;
    },
    passwordChanged(state) {
      if (state.user) state.user.mustChangePassword = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.user = action.payload;
        state.status = 'authenticated';
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.status = 'unauthenticated';
        state.error = action.payload ?? null;
      })
      .addCase(loginDemo.fulfilled, (state, action) => {
        state.user = action.payload;
        state.status = 'authenticated';
        state.error = null;
      })
      .addCase(loadSession.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(loadSession.fulfilled, (state, action) => {
        state.user = action.payload;
        state.status = action.payload ? 'authenticated' : 'unauthenticated';
      })
      .addCase(loadSession.rejected, (state) => {
        state.user = null;
        state.status = 'unauthenticated';
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.status = 'unauthenticated';
      })
      .addCase(acceptInvitation.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(acceptInvitation.fulfilled, (state, action) => {
        state.user = action.payload;
        state.status = 'authenticated';
        state.error = null;
      })
      .addCase(acceptInvitation.rejected, (state, action) => {
        state.status = 'unauthenticated';
        state.error = action.payload ?? null;
      });
  },
});

export const { sessionExpired, clearAuthError, passwordChanged } = authSlice.actions;

export const selectUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.status === 'authenticated';
export const selectAuthStatus = (state) => state.auth.status;
export const selectAuthError = (state) => state.auth.error;
export const selectMustChangePassword = (state) => state.auth.user?.mustChangePassword === true;

export default authSlice.reducer;
