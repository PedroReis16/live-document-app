class ApiService {
  constructor() {
    this.baseURL = "http://localhost:3000/api";
    this.token = null;
    this.refreshToken = null;
  }

  setAuthToken(token, refreshToken) {
    // Configurar tokens JWT
    // Salvar no AsyncStorage
  }

  async request(endpoint, options = {}) {
    // Interceptor para adicionar token
    // Verificar conectividade
    // Retry automático
    // Tratamento de erros 401/403
    // Renovação automática de token
  }

  // Auth endpoints
  async login(credentials) {
    /* POST /auth/login */
  }
  async register(userData) {
    /* POST /auth/register */
  }
  async refreshAccessToken() {
    /* POST /auth/refresh */
  }
  async logout() {
    /* POST /auth/logout */
  }

  // Document endpoints
  async getDocuments() {
    /* GET /documents */
  }
  async createDocument(data) {
    /* POST /documents */
  }
  async updateDocument(id, data) {
    /* PUT /documents/:id */
  }
  async deleteDocument(id) {
    /* DELETE /documents/:id */
  }
  async uploadImage(documentId, imageUri) {
    /* POST /documents/:id/images */
  }

  // Share endpoints
  async generateShareCode(documentId) {
    /* POST /share/generate */
  }
  async joinDocument(shareCode) {
    /* POST /share/join */
  }
  async getCollaborators(documentId) {
    /* GET /share/:id/collaborators */
  }
}
