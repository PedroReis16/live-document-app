import { io } from 'socket.io-client';
import { API_BASE_URL } from '../utils/constants';

class SocketService {
  constructor() {
    this.socket = null;
    this.currentDocument = null;
    this.handlers = {
      'document-change': [],
      'user-connected': [],
      'user-disconnected': [],
      'cursor-position': [],
      'user-typing': [],
      'error': []
    };
  }

  /**
   * Conecta ao servidor de socket
   * @param {String} token - Token JWT para autenticação
   */
  connect(token) {
    if (this.socket && this.socket.connected) {
      console.log('Socket já está conectado');
      return;
    }

    this.socket = io(API_BASE_URL, {
      auth: {
        token
      },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    this.setupListeners();
  }

  /**
   * Desconecta do servidor de socket
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.currentDocument = null;
    }
  }

  /**
   * Verifica se o socket está conectado
   * @returns {Boolean} Status da conexão
   */
  isSocketConnected() {
    return this.socket && this.socket.connected;
  }

  /**
   * Configura os listeners padrão do socket
   */
  setupListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket conectado!');
    });

    this.socket.on('disconnect', (reason) => {
      console.log(`Socket desconectado! Motivo: ${reason}`);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Erro de conexão socket:', error);
    });

    this.socket.on('auth-error', (data) => {
      console.error('Erro de autenticação socket:', data.message);
    });

    // Redirecionar eventos para os handlers registrados
    Object.keys(this.handlers).forEach(eventName => {
      this.socket.on(eventName, (data) => {
        this.handlers[eventName].forEach(handler => handler(data));
      });
    });
  }

  /**
   * Entra em um documento para colaboração
   * @param {String} documentId - ID do documento
   * @param {String} token - Token JWT opcional
   * @returns {Promise} Promessa resolvida quando conectado ao documento
   */
  joinDocument(documentId, token = null) {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.socket.connected) {
        return reject(new Error('Socket não está conectado'));
      }

      this.currentDocument = documentId;
      this.socket.emit('join-document', documentId, token);

      // Aguardar evento de conexão com sucesso
      const onConnected = (users) => {
        console.log(`Conectado ao documento ${documentId}`);
        this.socket.off('connected-users', onConnected);
        this.socket.off('auth-error', onError);
        this.socket.off('error', onError);
        resolve(users);
      };

      // Aguardar evento de erro
      const onError = (error) => {
        console.error(`Erro ao entrar no documento ${documentId}:`, error);
        this.socket.off('connected-users', onConnected);
        this.socket.off('auth-error', onError);
        this.socket.off('error', onError);
        reject(error);
      };

      // Registrar listeners temporários
      this.socket.once('connected-users', onConnected);
      this.socket.once('auth-error', onError);
      this.socket.once('error', onError);
    });
  }

  /**
   * Sai de um documento
   * @param {String} documentId - ID do documento
   */
  leaveDocument(documentId) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('leave-document', documentId);
      this.currentDocument = null;
    }
  }

  /**
   * Envia alterações no documento para outros usuários
   * @param {String} documentId - ID do documento
   * @param {Object} changes - Alterações feitas no documento
   */
  sendDocumentChanges(documentId, changes) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('document-change', documentId, changes);
    }
  }

  /**
   * Notifica que o usuário está digitando
   * @param {String} documentId - ID do documento
   * @param {Boolean} isTyping - Se o usuário está digitando
   */
  sendUserTyping(documentId, isTyping) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('user-typing', documentId, isTyping);
    }
  }

  /**
   * Envia a posição do cursor do usuário
   * @param {String} documentId - ID do documento
   * @param {Object} position - Posição do cursor
   */
  sendCursorPosition(documentId, position) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('cursor-position', documentId, position);
    }
  }

  /**
   * Registra um handler para um evento de socket
   * @param {String} event - Nome do evento
   * @param {Function} handler - Função para tratar o evento
   */
  on(event, handler) {
    if (this.handlers[event]) {
      this.handlers[event].push(handler);
    }
  }

  /**
   * Remove um handler de evento
   * @param {String} event - Nome do evento
   * @param {Function} handler - Função que foi registrada
   */
  off(event, handler) {
    if (this.handlers[event]) {
      this.handlers[event] = this.handlers[event].filter(h => h !== handler);
    }
  }
}

export default new SocketService();
