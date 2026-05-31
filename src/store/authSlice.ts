import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { UserSession, Teammate } from '../types';
import axios from 'axios';
import { apiClient } from '../api/apiClient';

// Initialize session state from LocalStorage coordinates
const initialToken = localStorage.getItem('cms_session_token');
const initialUser: Teammate | null = (() => {
  const userStr = localStorage.getItem('cms_session_user');
  try {
    return userStr ? JSON.parse(userStr) : null;
  } catch {
    return null;
  }
})();

const initialState: UserSession = {
  user: initialUser,
  token: initialToken,
  isAuthenticated: !!initialToken && !!initialUser,
  loading: !!initialToken,
  error: null,
};

function clearStoredSession() {
  localStorage.removeItem('cms_session_token');
  localStorage.removeItem('cms_session_refresh_token');
  localStorage.removeItem('cms_session_user');
}

export const validateSessionThunk = createAsyncThunk(
  'auth/validateSession',
  async (_, { rejectWithValue }) => {
    const token = localStorage.getItem('cms_session_token');
    if (!token) {
      return rejectWithValue('No active session');
    }

    try {
      const res = await apiClient.get('/auth/profile');
      if (res.data?.status === 'success' && res.data.data?.user) {
        const user = res.data.data.user;
        localStorage.setItem('cms_session_user', JSON.stringify(user));
        return { token, user };
      }
      clearStoredSession();
      return rejectWithValue('Session expired');
    } catch (err: any) {
      clearStoredSession();
      return rejectWithValue(err.message || 'Session validation failed');
    }
  }
);

// Async login Thunk
export const loginUserThunk = createAsyncThunk(
  'auth/loginUser',
  async (credentials: { emailOrUsername: string; passwordStr: string }, { rejectWithValue }) => {
    try {
      const res = await axios.post('/api/auth/login', {
        emailOrUsername: credentials.emailOrUsername,
        password: credentials.passwordStr,
      });
      if (res.data && res.data.status === 'success') {
        const { token, refreshToken, data } = res.data;
        localStorage.setItem('cms_session_token', token);
        localStorage.setItem('cms_session_refresh_token', refreshToken);
        localStorage.setItem('cms_session_user', JSON.stringify(data.user));
        return { token, user: data.user };
      }
      return rejectWithValue(res.data?.message || 'Login rejected by credentials check.');
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message || 'Server authentication connection failed');
    }
  }
);

// Async logout Thunk
export const logoutUserThunk = createAsyncThunk(
  'auth/logoutUser',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('cms_session_token');
      if (token) {
        await axios.post('/api/auth/logout', null, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (err) {
      console.warn('Silent backend logout coordinate failed to report', err);
    } finally {
      clearStoredSession();
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuthError: (state) => {
      state.error = null;
    },
    updateTeammateSession: (state, action: PayloadAction<Teammate>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      localStorage.setItem('cms_session_user', JSON.stringify(action.payload));
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUserThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUserThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(loginUserThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to authenticate sessions.';
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
      })
      .addCase(logoutUserThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(logoutUserThunk.fulfilled, (state) => {
        state.loading = false;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      .addCase(validateSessionThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(validateSessionThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(validateSessionThunk.rejected, (state) => {
        state.loading = false;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
      });
  },
});

export const { clearAuthError, updateTeammateSession } = authSlice.actions;
export default authSlice.reducer;
