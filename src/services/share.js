// filepath: d:\Documentos\Code\Projetos\document-app\src\services\share.js
import ApiService from './api';
import socketService from './socket';
import AsyncStorage from '@react-native-async-storage/async-storage';

class ShareService {
  constructor() {
    this.api = ApiService;
    this.shareCodesCache = new Map();
    this.collaboratorsCache = new Map();
  }

  // Gerar código de compartilhamento
  async generateShareCode(documentId) {
    try {
      const response = await this.api.generateShareCode(documentId);
      
      // Guardar no cache
      if (response && response.shareCode) {
        this.shareCodesCache.set(documentId, {
          code: response.shareCode,
          expiration: response.expiration,
          timestamp: Date.now()
        });
      }
      
      return response;
    } catch (error) {
      console.error('Erro ao gerar código de compartilhamento:', error);
      throw error;
    }
  }

  // Entrar em um documento compartilhado através do código
  async joinWithCode(shareCode) {
    try {
      const response = await this.api.joinDocument(shareCode);
      
      // Retornar informações do documento para navegar para ele
      return response;
    } catch (error) {
      console.error('Erro ao entrar no documento compartilhado:', error);
      throw error;
    }
  }

  // Buscar colaboradores de um documento
  async getCollaborators(documentId) {
    try {
      const response = await this.api.getCollaborators(documentId);
      
      // Guardar no cache
      if (response && response.collaborators) {
        this.collaboratorsCache.set(documentId, {
          collaborators: response.collaborators,
          timestamp: Date.now()
        });
      }
      
      return response.collaborators || [];
    } catch (error) {
      console.error('Erro ao buscar colaboradores:', error);
      
      // Em caso de erro, tentar retornar do cache se disponível
      const cached = this.collaboratorsCache.get(documentId);
      if (cached) {
        return cached.collaborators;
      }
      
      return [];
    }
  }

  // Atualizar permissão de um colaborador
  async updateCollaboratorPermission(documentId, userId, permission) {
    try {
      await this.api.updateCollaboratorPermission(documentId, userId, permission);
      
      // Atualizar cache
      const cached = this.collaboratorsCache.get(documentId);
      if (cached) {
        const updatedCollaborators = cached.collaborators.map(c => {
          if (c.id === userId) {
            return { ...c, permission };
          }
          return c;
        });
        
        this.collaboratorsCache.set(documentId, {
          collaborators: updatedCollaborators,
          timestamp: Date.now()
        });
      }
      
      return true;
    } catch (error) {
      console.error('Erro ao atualizar permissão de colaborador:', error);
      throw error;
    }
  }

  // Remover um colaborador
  async removeCollaborator(documentId, userId) {
    try {
      await this.api.removeCollaborator(documentId, userId);
      
      // Atualizar cache
      const cached = this.collaboratorsCache.get(documentId);
      if (cached) {
        const updatedCollaborators = cached.collaborators.filter(c => c.id !== userId);
        
        this.collaboratorsCache.set(documentId, {
          collaborators: updatedCollaborators,
          timestamp: Date.now()
        });
      }
      
      return true;
    } catch (error) {
      console.error('Erro ao remover colaborador:', error);
      throw error;
    }
  }

  // Verificar se um código salvo ainda é válido
  isShareCodeValid(documentId) {
    const cached = this.shareCodesCache.get(documentId);
    
    if (!cached) {
      return false;
    }
    
    // Verificar se o código expirou
    const now = Date.now();
    const expirationTime = new Date(cached.expiration).getTime();
    
    return expirationTime > now;
  }

  // Obter código salvo para um documento
  getShareCodeForDocument(documentId) {
    const cached = this.shareCodesCache.get(documentId);
    return cached && this.isShareCodeValid(documentId) ? cached.code : null;
  }

  // Configurar listeners de socket para eventos de colaboração
  setupCollaborationListeners(documentId, callbacks) {
    const { onUserJoined, onUserLeft, onPermissionChanged } = callbacks || {};
    
    // Desconectar listeners anteriores
    this.removeCollaborationListeners();
    
    // Configurar novos listeners se o socket estiver conectado
    if (socketService.isSocketConnected()) {
      this.unsubscribeUserJoined = onUserJoined ? 
        socketService.onCollaboratorJoined(onUserJoined) : 
        () => {};
        
      this.unsubscribeUserLeft = onUserLeft ? 
        socketService.onCollaboratorLeft(onUserLeft) : 
        () => {};
        
      this.unsubscribePermissionChanged = onPermissionChanged ? 
        socketService.onPermissionChanged(onPermissionChanged) : 
        () => {};
    }
  }

  // Remover listeners de socket para eventos de colaboração
  removeCollaborationListeners() {
    if (this.unsubscribeUserJoined) {
      this.unsubscribeUserJoined();
      this.unsubscribeUserJoined = null;
    }
    
    if (this.unsubscribeUserLeft) {
      this.unsubscribeUserLeft();
      this.unsubscribeUserLeft = null;
    }
    
    if (this.unsubscribePermissionChanged) {
      this.unsubscribePermissionChanged();
      this.unsubscribePermissionChanged = null;
    }
  }
}

export default new ShareService();