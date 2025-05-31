import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import ApiService from '../services/api';
import StorageService from '../services/storage';
import SocketService from '../services/socket';
import { baseApiService } from '../services/BaseApiService';

// Async thunks
export const login = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      // Fazer login na API
      const response = await ApiService.login(credentials);
      
      // Salvar tokens e dados do usuário no armazenamento local
      const { user, token, refreshToken } = response;
      ApiService.setAuthToken(token, refreshToken);
      await StorageService.setUserData(user);
      await StorageService.setTokens(token, refreshToken);
      
      // Conectar ao socket
      SocketService.connect(token);
      
      return response;
    } catch (error) {
      return rejectWithValue(error.message || 'Erro ao fazer login');
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      // Registrar na API
      const response = await ApiService.register(userData);
      
      // Salvar tokens e dados do usuário no armazenamento local
      const { user, token, refreshToken } = response;
      ApiService.setAuthToken(token, refreshToken);
      await StorageService.setUserData(user);
      await StorageService.setTokens(token, refreshToken);
      
      // Conectar ao socket
      SocketService.connect(token);
      
      return response;
    } catch (error) {
      return rejectWithValue(error.message || 'Erro ao criar conta');
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      // Fazer logout na API se estiver online
      try {
        await ApiService.logout();
      } catch (error) {
        console.log('Erro ao fazer logout na API, continuando localmente:', error);
      }
      
      // Desconectar socket
      SocketService.disconnect();
      
      // Limpar tokens
      ApiService.setAuthToken(null, null);
      await StorageService.clearTokens();
      
      return true;
    } catch (error) {
      return rejectWithValue(error.message || 'Erro ao fazer logout');
    }
  }
);

export const restoreAuthState = createAsyncThunk(
  'auth/restore',
  async (_, { rejectWithValue }) => {
    try {
      // Buscar tokens e dados do usuário do armazenamento local
      const tokens = await StorageService.getTokens();
      let user = await StorageService.getUserData();
      
      if (!tokens || !tokens.accessToken || !user) {
        return rejectWithValue('Nenhuma sessão encontrada');
      }
      
      // Restaurar tokens na API de forma explícita
      baseApiService.setAuthToken(tokens.accessToken, tokens.refreshToken);
      ApiService.setAuthToken(tokens.accessToken, tokens.refreshToken);
      
      // Verificar se o token é válido (opcional - fazer uma requisição para teste)
      try {
        // Tentar obter o perfil do usuário para verificar se o token é válido
        const updatedUser = await ApiService.getUserProfile();
        if (updatedUser) {
          // Atualizar os dados do usuário se obtiver sucesso
          await StorageService.setUserData(updatedUser);
          user = updatedUser;
        }
      } catch (verifyError) {
        console.log('Token pode estar expirado, tentando renovar:', verifyError);
        
        // Se houver erro, tentar renovar o token antes de falhar
        if (tokens.refreshToken) {
          try {
            const newToken = await baseApiService.refreshAuthToken();
            if (newToken) {
              tokens.accessToken = newToken;
            } else {
              // Se não conseguir renovar, limpar tudo
              await StorageService.clearTokens();
              await StorageService.clearUserData();
              return rejectWithValue('Sessão expirada');
            }
          } catch (refreshError) {
            console.error('Erro ao renovar token:', refreshError);
            return rejectWithValue('Erro ao renovar sessão');
          }
        }
      }
      
      // Tentar conectar ao socket
      try {
        SocketService.connect(tokens.accessToken);
      } catch (error) {
        console.log('Erro ao conectar socket durante restauração:', error);
        // Continuar mesmo se o socket falhar
      }
      
      return { user, token: tokens.accessToken, refreshToken: tokens.refreshToken };
    } catch (error) {
      console.error('Erro ao restaurar sessão:', error);
      return rejectWithValue(error.message || 'Erro ao restaurar sessão');
    }
  }
);

export const updateUserProfile = createAsyncThunk(
  'auth/updateProfile',
  async (profileData, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const userId = auth.user.id;
      
      // Atualizar perfil na API
      const updatedUser = await ApiService.updateProfile(userId, profileData);
      
      // Atualizar no armazenamento local
      await StorageService.setUserData(updatedUser);
      
      return updatedUser;
    } catch (error) {
      return rejectWithValue(error.message || 'Erro ao atualizar perfil');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    token: null,
    refreshToken: null,
    loading: false,
    error: null,
    isAuthenticated: false,
    isInitialized: false
  },
  reducers: {
    resetAuthError(state) {
      state.error = null;
    },
    setAuthInitialized(state) {
      state.isInitialized = true;
    }
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
      })
      
      // Register
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
      })
      
      // Logout
      .addCase(logout.pending, (state) => {
        state.loading = true;
      })
      .addCase(logout.fulfilled, (state) => {
        state.loading = false;
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
      })
      .addCase(logout.rejected, (state) => {
        state.loading = false;
        // Mesmo em caso de erro, limpar estado
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
      })
      
      // Restore auth state
      .addCase(restoreAuthState.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.isInitialized = false;
      })
      .addCase(restoreAuthState.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        state.isInitialized = true;
      })
      .addCase(restoreAuthState.rejected, (state, action) => {
        state.loading = false;
        state.error = null; // Não mostrar erro ao restaurar
        state.isAuthenticated = false;
        state.isInitialized = true;
      })
      
      // Update profile
      .addCase(updateUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { resetAuthError, setAuthInitialized } = authSlice.actions;

export default authSlice;
