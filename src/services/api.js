import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

class ApiService {
  constructor() {
    // Atualizar para o URL onde a API live-document está hospedada
    this.baseURL = "https://live-document-api.herokuapp.com/api";
    // Ou use localhost para desenvolvimento local:
    // this.baseURL = "http://192.168.1.X:5000/api"; // Substitua pelo seu IP local
    this.token = null;
    this.refreshToken = null;
  }

  setAuthToken(token, refreshToken) {
    this.token = token;
    this.refreshToken = refreshToken;
    
    // Salvar tokens no AsyncStorage
    if (token && refreshToken) {
      AsyncStorage.setItem('token', token);
      AsyncStorage.setItem('refreshToken', refreshToken);
    } else {
      AsyncStorage.removeItem('token');
      AsyncStorage.removeItem('refreshToken');
    }
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    // Configuração padrão
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };
    
    // Adicionar token de autenticação se disponível
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    const config = {
      ...options,
      headers
    };
    
    try {
      // Verificar conectividade antes de fazer a requisição
      const isConnected = await NetInfo.fetch().then(state => state.isConnected);
      
      if (!isConnected) {
        throw new Error('Sem conexão com a internet');
      }
      
      const response = await fetch(url, config);
      const data = await response.json();
      
      // Tratar erro de autenticação (token expirado)
      if (response.status === 401 && this.refreshToken) {
        try {
          // Tentar renovar o token
          const refreshData = await this.refreshAccessToken();
          
          // Atualizar token e repetir a requisição original
          this.setAuthToken(refreshData.token, refreshData.refreshToken);
          
          // Refazer a requisição original com o novo token
          headers['Authorization'] = `Bearer ${refreshData.token}`;
          const newConfig = { ...config, headers };
          const newResponse = await fetch(url, newConfig);
          return await newResponse.json();
        } catch (refreshError) {
          // Se falhar na renovação do token, fazer logout
          throw new Error('Sessão expirada, faça login novamente');
        }
      }
      
      // Se a resposta não for bem-sucedida, lançar erro
      if (!response.ok) {
        throw new Error(data.message || 'Erro na requisição');
      }
      
      return data;
    } catch (error) {
      console.error(`Erro na requisição para ${url}:`, error);
      throw error;
    }
  }

  // Auth endpoints
  async login(credentials) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
    return data;
  }
  
  async register(userData) {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
    return data;
  }
  
  async refreshAccessToken() {
    const data = await this.request('/auth/refresh', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.refreshToken}`
      }
    });
    return data;
  }
  
  async logout() {
    return await this.request('/auth/logout', {
      method: 'POST'
    });
  }

  // Document endpoints
  async getDocuments() {
    return await this.request('/documents');
  }
  
  async getDocument(id) {
    return await this.request(`/documents/${id}`);
  }
  
  async createDocument(data) {
    return await this.request('/documents', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
  
  async updateDocument(id, data) {
    return await this.request(`/documents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }
  
  async deleteDocument(id) {
    return await this.request(`/documents/${id}`, {
      method: 'DELETE'
    });
  }
  
  async uploadImage(documentId, imageUri) {
    const formData = new FormData();
    
    // Criar objeto de arquivo para upload
    const fileUriParts = imageUri.split('.');
    const fileType = fileUriParts[fileUriParts.length - 1];
    
    formData.append('image', {
      uri: imageUri,
      name: `photo.${fileType}`,
      type: `image/${fileType}`
    });
    
    return await this.request(`/documents/${documentId}/images`, {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      body: formData
    });
  }

  // Share endpoints
  async generateShareCode(documentId) {
    return await this.request('/share/generate', {
      method: 'POST',
      body: JSON.stringify({ documentId })
    });
  }
  
  async joinDocument(shareCode) {
    return await this.request('/share/join', {
      method: 'POST',
      body: JSON.stringify({ shareCode })
    });
  }
  
  async getCollaborators(documentId) {
    return await this.request(`/share/${documentId}/collaborators`);
  }
  
  async updateCollaboratorPermission(documentId, userId, permission) {
    return await this.request(`/share/${documentId}/permissions`, {
      method: 'PUT',
      body: JSON.stringify({ userId, permission })
    });
  }
  
  async removeCollaborator(documentId, userId) {
    return await this.request(`/share/${documentId}/collaborators/${userId}`, {
      method: 'DELETE'
    });
  }
}

export default new ApiService();
