import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import StorageService from './storage';
import { API_BASE_URL } from '../utils/constants';

class ApiService {
  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    this.refreshTokenRequest = null;

    // Configurar interceptores
    this.setupInterceptors();
  }

  // Configurar interceptores para tratamento automático de tokens
  setupInterceptors() {
    // Interceptor de requisição
    this.api.interceptors.request.use(
      async (config) => {
        // Adicionar token de acesso ao cabeçalho se disponível
        const token = await AsyncStorage.getItem('accessToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Interceptor de resposta
    this.api.interceptors.response.use(
      (response) => response.data,
      async (error) => {
        const originalRequest = error.config;
        
        // Se erro 401 (não autorizado) e não foi uma tentativa de refresh token
        if (error.response && error.response.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            // Tentar renovar o token
            const newToken = await this.refreshAuthToken();
            
            if (newToken) {
              // Configurar novo token no cabeçalho
              this.api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
              originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
              
              // Refazer a requisição original com o novo token
              return this.api(originalRequest);
            }
          } catch (refreshError) {
            console.error('Erro ao renovar token:', refreshError);
            
            // Falha ao renovar token - logout
            await StorageService.clearTokens();
            await StorageService.clearUserData();
            
            // Emitir evento para forçar logout na aplicação
            const event = new CustomEvent('sessionExpired');
            document.dispatchEvent(event);
          }
        }
        
        // Retornar o erro para ser tratado pelo chamador
        return Promise.reject(error);
      }
    );
  }

  // Definir token de autenticação
  setAuthToken(accessToken, refreshToken = null) {
    if (accessToken) {
      this.api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
    } else {
      delete this.api.defaults.headers.common['Authorization'];
    }
  }

  // Renovar token de autenticação
  async refreshAuthToken() {
    // Evitar múltiplas requisições de refresh simultaneamente
    if (!this.refreshTokenRequest) {
      this.refreshTokenRequest = (async () => {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        
        if (!refreshToken) {
          return null;
        }
        
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken
          });
          
          if (response.data && response.data.accessToken) {
            const newToken = response.data.accessToken;
            
            // Salvar novo token
            await AsyncStorage.setItem('accessToken', newToken);
            
            return newToken;
          }
          return null;
        } catch (error) {
          console.error('Falha ao renovar token:', error);
          return null;
        } finally {
          this.refreshTokenRequest = null;
        }
      })();
    }
    
    return this.refreshTokenRequest;
  }

  // Autenticação
  async login(credentials) {
    try {
      const response = await this.api.post('/auth/login', credentials);
      return response;
    } catch (error) {
      console.error('Erro de login:', error);
      throw error;
    }
  }

  async register(userData) {
    try {
      const response = await this.api.post('/auth/register', userData);
      return response;
    } catch (error) {
      console.error('Erro de registro:', error);
      throw error;
    }
  }

  async logout() {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (token) {
        await this.api.post('/auth/logout', { accessToken: token });
      }
      return true;
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      throw error;
    } finally {
      // Limpar dados mesmo se houver erro na API
      this.setAuthToken(null);
      await StorageService.clearTokens();
      await StorageService.clearUserData();
    }
  }

  async requestPasswordReset(email) {
    try {
      const response = await this.api.post('/auth/forgot-password', { email });
      return response;
    } catch (error) {
      console.error('Erro ao solicitar redefinição de senha:', error);
      throw error;
    }
  }

  // Serviço de usuário
  async getUserProfile() {
    try {
      const response = await this.api.get('/users/me');
      return response;
    } catch (error) {
      console.error('Erro ao buscar perfil do usuário:', error);
      throw error;
    }
  }

  async updateProfile(profileData) {
    try {
      const response = await this.api.put('/users/me', profileData);
      return response;
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      throw error;
    }
  }

  async updatePassword(passwordData) {
    try {
      const response = await this.api.put('/users/me/password', passwordData);
      return response;
    } catch (error) {
      console.error('Erro ao atualizar senha:', error);
      throw error;
    }
  }

  async uploadAvatar(formData) {
    try {
      const response = await this.api.post('/users/me/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response;
    } catch (error) {
      console.error('Erro ao fazer upload de avatar:', error);
      throw error;
    }
  }

  // Documentos
  async getDocuments() {
    try {
      const response = await this.api.get('/documents');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar documentos:', error);
      throw error;
    }
  }

  async getDocument(id) {
    try {
      const response = await this.api.get(`/documents/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar documento:', error);
      throw error;
    }
  }

  async createDocument(documentData) {
    try {
      const response = await this.api.post('/documents', documentData);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar documento:', error);
      throw error;
    }
  }

  async updateDocument(id, documentData) {
    try {
      const response = await this.api.put(`/documents/${id}`, documentData);
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar documento:', error);
      throw error;
    }
  }

  async deleteDocument(id) {
    try {
      const response = await this.api.delete(`/documents/${id}`);
      return response;
    } catch (error) {
      console.error('Erro ao excluir documento:', error);
      throw error;
    }
  }
}

export default new ApiService();
