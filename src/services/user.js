import { baseApiService } from './BaseApiService';

class UserService {
  constructor() {
    this.api = baseApiService.api;
  }

  /**
   * Busca o perfil do usuário atual
   * @returns {Promise} Promessa com dados do perfil
   */
  async getUserProfile() {
    try {
      const response = await this.api.get('/api/users/me');
      return response;
    } catch (error) {
      console.error('Erro ao buscar perfil do usuário:', error);
      throw error;
    }
  }

  /**
   * Atualiza o perfil do usuário
   * @param {Object} profileData - Novos dados do perfil
   * @returns {Promise} Promessa com perfil atualizado
   */
  async updateProfile(profileData) {
    try {
      const response = await this.api.put('/api/users/me', profileData);
      return response;
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      throw error;
    }
  }

  /**
   * Atualiza a senha do usuário
   * @param {Object} passwordData - Objeto com senha antiga e nova
   * @returns {Promise} Promessa para alteração de senha
   */
  async updatePassword(passwordData) {
    try {
      const response = await this.api.put('/api/users/me/password', passwordData);
      return response;
    } catch (error) {
      console.error('Erro ao atualizar senha:', error);
      throw error;
    }
  }

  /**
   * Faz upload de avatar do usuário
   * @param {FormData} formData - FormData com a imagem
   * @returns {Promise} Promessa com URL do avatar
   */
  async uploadAvatar(formData) {
    try {
      const response = await this.api.post('/api/users/me/avatar', formData, {
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

  /**
   * Remove avatar do usuário
   * @returns {Promise} Promessa para remoção do avatar
   */
  async removeAvatar() {
    try {
      const response = await this.api.delete('/api/users/me/avatar');
      return response;
    } catch (error) {
      console.error('Erro ao remover avatar:', error);
      throw error;
    }
  }

  /**
   * Atualiza preferências do usuário
   * @param {Object} preferences - Preferências do usuário
   * @returns {Promise} Promessa com preferências atualizadas
   */
  async updatePreferences(preferences) {
    try {
      const response = await this.api.put('/api/users/me/preferences', preferences);
      return response;
    } catch (error) {
      console.error('Erro ao atualizar preferências:', error);
      throw error;
    }
  }
}

export default new UserService();