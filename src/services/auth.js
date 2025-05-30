import ApiService from './api';
import StorageService from './storage';
import socketService from './socket';
import { Platform } from 'react-native';
import * as Device from 'expo-device';

class AuthService {
  constructor() {
    this.api = ApiService;
    this.storage = StorageService;
    this.deviceInfo = null;
  }

  // Obter informações do dispositivo para identificação
  async getDeviceInfo() {
    if (this.deviceInfo) return this.deviceInfo;

    const deviceName = Device.deviceName || 'Dispositivo desconhecido';
    const deviceType = Device.deviceType;
    let deviceTypeText = 'desconhecido';
    
    switch (deviceType) {
      case Device.DeviceType.PHONE:
        deviceTypeText = 'smartphone';
        break;
      case Device.DeviceType.TABLET:
        deviceTypeText = 'tablet';
        break;
      case Device.DeviceType.DESKTOP:
        deviceTypeText = 'desktop';
        break;
      case Device.DeviceType.TV:
        deviceTypeText = 'TV';
        break;
    }
    
    this.deviceInfo = {
      deviceId: await Device.getDeviceId() || 'unknown',
      platform: Platform.OS,
      model: Device.modelName || 'Desconhecido',
      name: deviceName,
      type: deviceTypeText,
      osVersion: Platform.Version,
      appVersion: '1.0.0' // Atualizar com a versão real do app
    };
    
    return this.deviceInfo;
  }

  // Login
  async login(email, password) {
    try {
      const deviceInfo = await this.getDeviceInfo();
      
      const credentials = {
        email,
        password,
        deviceInfo
      };
      
      const response = await this.api.login(credentials);
      
      // Salvar tokens e dados do usuário no armazenamento local
      const { user, token, refreshToken } = response;
      this.api.setAuthToken(token, refreshToken);
      await this.storage.setUserData(user);
      await this.storage.setTokens(token, refreshToken);
      
      // Conectar ao socket
      socketService.connect(token);
      
      return response;
    } catch (error) {
      console.error('Erro de login:', error);
      throw error;
    }
  }

  // Registro
  async register(userData) {
    try {
      const deviceInfo = await this.getDeviceInfo();
      
      const registrationData = {
        ...userData,
        deviceInfo
      };
      
      const response = await this.api.register(registrationData);
      
      // Salvar tokens e dados do usuário no armazenamento local
      const { user, token, refreshToken } = response;
      this.api.setAuthToken(token, refreshToken);
      await this.storage.setUserData(user);
      await this.storage.setTokens(token, refreshToken);
      
      // Conectar ao socket
      socketService.connect(token);
      
      return response;
    } catch (error) {
      console.error('Erro de registro:', error);
      throw error;
    }
  }

  // Logout
  async logout() {
    try {
      // Tentar fazer logout na API
      try {
        await this.api.logout();
      } catch (error) {
        console.log('Erro ao fazer logout na API, continuando localmente:', error);
      }
      
      // Desconectar socket
      socketService.disconnect();
      
      // Limpar tokens
      this.api.setAuthToken(null, null);
      await this.storage.clearTokens();
      
      return true;
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      throw error;
    }
  }

  // Verificar se está autenticado
  async isAuthenticated() {
    try {
      const tokens = await this.storage.getTokens();
      return !!(tokens && tokens.accessToken);
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      return false;
    }
  }

  // Restaurar estado de autenticação
  async restoreAuth() {
    try {
      const tokens = await this.storage.getTokens();
      const user = await this.storage.getUserData();
      
      if (!tokens || !tokens.accessToken || !user) {
        return null;
      }
      
      // Restaurar tokens na API
      this.api.setAuthToken(tokens.accessToken, tokens.refreshToken);
      
      // Tentar reconectar socket
      try {
        socketService.connect(tokens.accessToken);
      } catch (error) {
        console.error('Erro ao reconectar socket:', error);
      }
      
      return {
        user,
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken
      };
    } catch (error) {
      console.error('Erro ao restaurar autenticação:', error);
      return null;
    }
  }

  // Atualizar perfil
  async updateProfile(userId, profileData) {
    try {
      const response = await this.api.updateProfile(userId, profileData);
      
      // Atualizar dados do usuário no armazenamento local
      await this.storage.setUserData(response.user);
      
      return response.user;
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      throw error;
    }
  }

  // Esqueci a senha
  async forgotPassword(email) {
    try {
      return await this.api.forgotPassword(email);
    } catch (error) {
      console.error('Erro ao solicitar recuperação de senha:', error);
      throw error;
    }
  }

  // Resetar senha
  async resetPassword(token, newPassword) {
    try {
      return await this.api.resetPassword(token, newPassword);
    } catch (error) {
      console.error('Erro ao resetar senha:', error);
      throw error;
    }
  }

  // Alterar senha
  async changePassword(oldPassword, newPassword) {
    try {
      return await this.api.changePassword(oldPassword, newPassword);
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      throw error;
    }
  }
}

export default new AuthService();
