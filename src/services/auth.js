class AuthService {
  constructor() {
    this.api = new ApiService();
    this.currentUser = null;
  }

  async login(credentials) {
    // Validar credenciais
    // Chamar API
    // Salvar tokens
    // Atualizar estado global
  }

  async register(userData) {
    // Upload de avatar (se houver)
    // Registrar usuário
    // Auto-login
  }

  async logout() {
    // Limpar tokens
    // Limpar AsyncStorage
    // Desconectar socket
    // Resetar estado
  }

  async getCurrentUser() {
    // Verificar token salvo
    // Validar expiração
    // Retornar dados do usuário
  }

  async isAuthenticated() {
    // Verificar se tem token válido
  }
}
