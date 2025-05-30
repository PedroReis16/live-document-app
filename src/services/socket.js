import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

// URL do servidor socket (deve corresponder ao backend live-document)
const SOCKET_URL = 'https://live-document-api.herokuapp.com';
// Ou para desenvolvimento local:
// const SOCKET_URL = 'http://192.168.1.X:5000'; // Substitua pelo seu IP local

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.currentDocument = null;
    this.callbacks = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  connect(token) {
    // Desconectar se já estiver conectado
    if (this.socket) {
      this.disconnect();
    }

    // Conectar com autenticação JWT
    this.socket = io(SOCKET_URL, {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      timeout: 10000,
    });

    // Configurar listeners básicos
    this.socket.on('connect', () => {
      console.log('Socket conectado!');
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket desconectado:', reason);
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Erro na conexão do socket:', error);
      this.isConnected = false;
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Número máximo de tentativas de reconexão atingido');
        this.socket.disconnect();
      }
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      // Desconectar socket
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      // Limpar listeners
      this.callbacks.clear();
      console.log('Socket desconectado e limpado');
    }
  }

  // Document collaboration
  joinDocument(documentId) {
    if (!this.isConnected || !this.socket) {
      console.error('Socket não está conectado');
      return Promise.reject('Socket não está conectado');
    }

    return new Promise((resolve, reject) => {
      this.socket.emit('document:join', { documentId }, (response) => {
        if (response && response.error) {
          console.error('Erro ao entrar no documento:', response.error);
          reject(response.error);
        } else {
          this.currentDocument = documentId;
          console.log('Entrou no documento:', documentId);
          resolve(response ? response.document : documentId);
        }
      });
    });
  }

  leaveDocument(documentId) {
    if (!this.isConnected || !this.socket) {
      console.error('Socket não está conectado');
      return;
    }

    this.socket.emit('document:leave', { documentId });
    this.currentDocument = null;
    console.log('Saiu do documento:', documentId);
  }

  onDocumentChange(callback) {
    if (!this.isConnected || !this.socket) {
      console.error('Socket não está conectado');
      return () => {};
    }

    const handler = (data) => {
      callback(data);
    };

    this.socket.on('document:change', handler);
    this.callbacks.set('document:change', handler);

    // Retorna função para remover o listener
    return () => {
      if (this.socket) {
        this.socket.off('document:change', handler);
        this.callbacks.delete('document:change');
      }
    };
  }

  emitDocumentChange(documentId, changes) {
    if (!this.isConnected || !this.socket) {
      console.error('Socket não está conectado');
      return;
    }

    this.socket.emit('document:change', {
      documentId,
      changes,
      timestamp: Date.now()
    });
  }

  onUserTyping(callback) {
    if (!this.isConnected || !this.socket) {
      console.error('Socket não está conectado');
      return () => {};
    }

    const handler = (data) => {
      callback(data);
    };

    this.socket.on('document:typing', handler);
    this.callbacks.set('document:typing', handler);

    return () => {
      if (this.socket) {
        this.socket.off('document:typing', handler);
        this.callbacks.delete('document:typing');
      }
    };
  }

  // Throttled para evitar excesso de eventos
  emitUserTyping(documentId) {
    if (!this.isConnected || !this.socket) {
      console.error('Socket não está conectado');
      return;
    }
    
    // Se já enviou recentemente, não envia novamente
    if (this._typingTimeout) {
      return;
    }
    
    this.socket.emit('document:typing', { documentId });
    
    // Define throttle de 1 segundo
    this._typingTimeout = setTimeout(() => {
      this._typingTimeout = null;
    }, 1000);
  }

  onCollaboratorJoined(callback) {
    if (!this.isConnected || !this.socket) {
      console.error('Socket não está conectado');
      return () => {};
    }

    const handler = (data) => {
      callback(data);
    };

    this.socket.on('document:user_joined', handler);
    this.callbacks.set('document:user_joined', handler);

    return () => {
      if (this.socket) {
        this.socket.off('document:user_joined', handler);
        this.callbacks.delete('document:user_joined');
      }
    };
  }

  onCollaboratorLeft(callback) {
    if (!this.isConnected || !this.socket) {
      console.error('Socket não está conectado');
      return () => {};
    }

    const handler = (data) => {
      callback(data);
    };

    this.socket.on('document:user_left', handler);
    this.callbacks.set('document:user_left', handler);

    return () => {
      if (this.socket) {
        this.socket.off('document:user_left', handler);
        this.callbacks.delete('document:user_left');
      }
    };
  }

  // Eventos para permissões de colaboração
  onPermissionChanged(callback) {
    if (!this.isConnected || !this.socket) {
      console.error('Socket não está conectado');
      return () => {};
    }

    const handler = (data) => {
      callback(data);
    };

    this.socket.on('document:permission_changed', handler);
    this.callbacks.set('document:permission_changed', handler);

    return () => {
      if (this.socket) {
        this.socket.off('document:permission_changed', handler);
        this.callbacks.delete('document:permission_changed');
      }
    };
  }

  // Método para verificar a conexão
  isSocketConnected() {
    return this.isConnected && this.socket && this.socket.connected;
  }
  
  // Método para reconectar com o token armazenado
  async reconnectWithStoredToken() {
    try {
      const tokenStr = await AsyncStorage.getItem('token');
      if (tokenStr) {
        return this.connect(tokenStr);
      }
      return null;
    } catch (error) {
      console.error('Erro ao reconectar com token armazenado:', error);
      return null;
    }
  }
}

export default new SocketService();
