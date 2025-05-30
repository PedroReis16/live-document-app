// filepath: d:\Documentos\Code\Projetos\document-app\src\services\share.js
import { baseApiService } from './BaseApiService';

class ShareService {
  constructor() {
    this.api = baseApiService.api;
  }

  /**
   * Compartilha um documento com outros usuários
   * @param {string} documentId - ID do documento
   * @param {Array} users - Lista de usuários para compartilhar (email e permissão)
   * @returns {Promise} Promessa com resultado do compartilhamento
   */
  async shareDocument(documentId, users) {
    try {
      const response = await this.api.post(`/share/document/${documentId}`, { users });
      return response;
    } catch (error) {
      console.error(`Erro ao compartilhar documento ${documentId}:`, error);
      throw error;
    }
  }

  /**
   * Revoga compartilhamento com um usuário específico
   * @param {string} documentId - ID do documento
   * @param {string} userId - ID do usuário
   * @returns {Promise} Promessa com resultado da revogação
   */
  async revokeDocumentAccess(documentId, userId) {
    try {
      const response = await this.api.delete(`/share/document/${documentId}/user/${userId}`);
      return response;
    } catch (error) {
      console.error(`Erro ao revogar acesso ao documento ${documentId}:`, error);
      throw error;
    }
  }

  /**
   * Atualiza permissão de um usuário em um documento compartilhado
   * @param {string} documentId - ID do documento
   * @param {string} userId - ID do usuário
   * @param {string} permission - Nova permissão (read, write, admin)
   * @returns {Promise} Promessa com permissão atualizada
   */
  async updateUserPermission(documentId, userId, permission) {
    try {
      const response = await this.api.put(`/share/document/${documentId}/user/${userId}`, { permission });
      return response;
    } catch (error) {
      console.error(`Erro ao atualizar permissão no documento ${documentId}:`, error);
      throw error;
    }
  }

  /**
   * Busca todos os usuários com quem o documento está compartilhado
   * @param {string} documentId - ID do documento
   * @returns {Promise} Promessa com lista de compartilhamentos
   */
  async getDocumentShares(documentId) {
    try {
      const response = await this.api.get(`/share/document/${documentId}`);
      return response;
    } catch (error) {
      console.error(`Erro ao buscar compartilhamentos do documento ${documentId}:`, error);
      throw error;
    }
  }

  /**
   * Cria um link público para acesso a um documento
   * @param {string} documentId - ID do documento
   * @param {Object} options - Opções do link (expiração, permissão)
   * @returns {Promise} Promessa com dados do link
   */
  async createPublicLink(documentId, options = {}) {
    try {
      const response = await this.api.post(`/share/document/${documentId}/public-link`, options);
      return response;
    } catch (error) {
      console.error(`Erro ao criar link público para documento ${documentId}:`, error);
      throw error;
    }
  }

  /**
   * Revoga um link público de um documento
   * @param {string} documentId - ID do documento
   * @param {string} linkId - ID do link público
   * @returns {Promise} Promessa com resultado da revogação
   */
  async revokePublicLink(documentId, linkId) {
    try {
      const response = await this.api.delete(`/share/document/${documentId}/public-link/${linkId}`);
      return response;
    } catch (error) {
      console.error(`Erro ao revogar link público do documento ${documentId}:`, error);
      throw error;
    }
  }

  /**
   * Entra em um documento compartilhado através de convite
   * @param {string} inviteCode - Código do convite
   * @returns {Promise} Promessa com acesso ao documento
   */
  async joinSharedDocument(inviteCode) {
    try {
      const response = await this.api.post('/share/join', { inviteCode });
      return response;
    } catch (error) {
      console.error('Erro ao entrar em documento compartilhado:', error);
      throw error;
    }
  }

  /**
   * Busca todos os documentos compartilhados com o usuário atual
   * @returns {Promise} Promessa com lista de documentos compartilhados
   */
  async getSharedWithMeDocuments() {
    try {
      const response = await this.api.get('/share/shared-with-me');
      return response;
    } catch (error) {
      console.error('Erro ao buscar documentos compartilhados comigo:', error);
      throw error;
    }
  }
}

export default new ShareService();