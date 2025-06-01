// filepath: d:\Documentos\Code\Projetos\document-app\src\services\share.js
import { baseApiService } from './BaseApiService';

class ShareService {
  constructor() {
    this.api = baseApiService.api;
  }

  /**
   * Compartilha um documento com um usuário pelo email
   * @param {String} documentId - ID do documento
   * @param {String} email - Email do destinatário
   * @param {String} permission - Permissão a conceder
   * @returns {Promise} Promessa com resultado do compartilhamento
   */
  async shareWithUser(documentId, email, permission = 'read') {
    try {
      const response = await this.api.post(`/api/share/${documentId}`, {
        email,
        permission
      });
      return response;
    } catch (error) {
      console.error("Erro ao compartilhar documento:", error);
      throw error;
    }
  }

  /**
   * Revoga acesso de um usuário a um documento
   * @param {String} documentId - ID do documento
   * @param {String} userId - ID do usuário
   * @returns {Promise} Promessa com resultado da operação
   */
  async revokeAccess(documentId, userId) {
    try {
      const response = await this.api.delete(`/api/share/${documentId}/${userId}`);
      return response;
    } catch (error) {
      console.error("Erro ao revogar acesso:", error);
      throw error;
    }
  }

  /**
   * Obtém lista de compartilhamentos de um documento
   * @param {String} documentId - ID do documento
   * @returns {Promise} Promessa com lista de compartilhamentos
   */
  async getShares(documentId) {
    try {
      const response = await this.api.get(`/api/share/${documentId}`);
      return response;
    } catch (error) {
      console.error("Erro ao obter compartilhamentos:", error);
      throw error;
    }
  }
  
  /**
   * Atualiza permissão de um usuário em um documento
   * @param {String} documentId - ID do documento
   * @param {String} userId - ID do usuário
   * @param {String} permission - Nova permissão
   * @returns {Promise} Promessa com resultado da operação
   */
  async updatePermission(documentId, userId, permission) {
    try {
      const response = await this.api.put(`/api/share/${documentId}/${userId}`, {
        permission
      });
      return response;
    } catch (error) {
      console.error("Erro ao atualizar permissão:", error);
      throw error;
    }
  }

  /**
   * Gera um código de compartilhamento para um documento
   * @param {String} documentId - ID do documento
   * @returns {Promise} Promessa com código de compartilhamento
   */
  async generateShareCode(documentId) {
    try {
      const response = await this.api.post(`/api/share/${documentId}/code`);
      return response;
    } catch (error) {
      console.error("Erro ao gerar código de compartilhamento:", error);
      throw error;
    }
  }

  /**
   * Entra em um documento usando código de compartilhamento
   * @param {String} shareCode - Código de compartilhamento
   * @returns {Promise} Promessa com informações do documento
   */
  async joinWithCode(shareCode) {
    try {
      const response = await this.api.post('/api/share/join', { shareCode });
      return response;
    } catch (error) {
      console.error("Erro ao entrar com código de compartilhamento:", error);
      throw error;
    }
  }
  
  /**
   * Gera um link de compartilhamento para o documento
   * @param {String} documentId - ID do documento
   * @param {Object} options - Opções do link (permission, expiresIn)
   * @returns {Promise} Promessa com informações do link gerado
   */
  async generateShareLink(documentId, options = {}) {
    try {
      const response = await this.api.post(`/api/share/document/${documentId}/generate-link`, options);
      return response;
    } catch (error) {
      console.error("Erro ao gerar link de compartilhamento:", error);
      throw error;
    }
  }
  
  /**
   * Entra em um documento usando token de compartilhamento (via QR code ou URL)
   * @param {String} shareToken - Token do link de compartilhamento
   * @returns {Promise} Promessa com informações do documento
   */
  async joinByShareToken(shareToken) {
    try {
      console.log(shareToken);

      const response = await this.api.post('/api/share/join-by-token', { shareToken });
      return response;
    } catch (error) {
      console.error("Erro ao entrar com token de compartilhamento:", error);
      throw error;
    }
  }

  /**
   * Obtém lista de colaboradores de um documento
   * @param {String} documentId - ID do documento
   * @returns {Promise} Promessa com lista de colaboradores
   */
  async getCollaborators(documentId) {
    try {
      const response = await this.api.get(`/api/share/${documentId}/collaborators`);
      return response;
    } catch (error) {
      console.error("Erro ao obter colaboradores:", error);
      throw error;
    }
  }
  
  /**
   * Atualiza permissão de um colaborador em um documento
   * @param {String} documentId - ID do documento
   * @param {String} userId - ID do usuário
   * @param {String} permission - Nova permissão (read/write)
   * @returns {Promise} Promessa com resultado da operação
   */
  async updateCollaboratorPermission(documentId, userId, permission) {
    try {
      const response = await this.api.put(`/api/share/${documentId}/collaborators/${userId}`, {
        permission
      });
      return response;
    } catch (error) {
      console.error("Erro ao atualizar permissão do colaborador:", error);
      throw error;
    }
  }
  
  /**
   * Remove um colaborador de um documento
   * @param {String} documentId - ID do documento
   * @param {String} userId - ID do usuário a ser removido
   * @returns {Promise} Promessa com resultado da operação
   */
  async removeCollaborator(documentId, userId) {
    try {
      const response = await this.api.delete(`/api/share/${documentId}/collaborators/${userId}`);
      return response;
    } catch (error) {
      console.error("Erro ao remover colaborador:", error);
      throw error;
    }
  }
}

export default new ShareService();