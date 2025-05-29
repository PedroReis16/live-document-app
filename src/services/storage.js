class StorageService {
  // User data
  async setUserData(userData) {
    // Salvar dados do usuário
  }

  async getUserData() {
    // Recuperar dados do usuário
  }

  // Auth tokens
  async setTokens(accessToken, refreshToken) {
    // Salvar tokens JWT
  }

  async getTokens() {
    // Recuperar tokens
  }

  async clearTokens() {
    // Limpar tokens (logout)
  }

  // Documents
  async saveDocument(document) {
    // Salvar documento localmente
    // Manter histórico de versões
  }

  async getDocument(id) {
    // Recuperar documento local
  }

  async getAllDocuments() {
    // Listar todos os documentos locais
  }

  async deleteDocument(id) {
    // Remover documento local
  }

  // Sync queue
  async addToSyncQueue(operation) {
    // Adicionar operação pendente
  }

  async getSyncQueue() {
    // Recuperar operações pendentes
  }

  async clearSyncQueue() {
    // Limpar queue após sync
  }
}
