import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';

class StorageService {
  // Chaves para o AsyncStorage
  USER_KEY = '@DocumentApp:user';
  TOKENS_KEY = '@DocumentApp:tokens';
  DOCUMENTS_KEY = '@DocumentApp:documents';
  DOCUMENT_PREFIX = '@DocumentApp:doc_';
  SYNC_QUEUE_KEY = '@DocumentApp:sync_queue';

  // User data
  async setUserData(userData) {
    try {
      await AsyncStorage.setItem(this.USER_KEY, JSON.stringify(userData));
      return true;
    } catch (error) {
      console.error('Erro ao salvar dados do usuário:', error);
      return false;
    }
  }

  async getUserData() {
    try {
      const userData = await AsyncStorage.getItem(this.USER_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Erro ao recuperar dados do usuário:', error);
      return null;
    }
  }

  // Auth tokens
  async setTokens(accessToken, refreshToken) {
    try {
      const tokens = { accessToken, refreshToken };
      await AsyncStorage.setItem(this.TOKENS_KEY, JSON.stringify(tokens));
      return true;
    } catch (error) {
      console.error('Erro ao salvar tokens:', error);
      return false;
    }
  }

  async getTokens() {
    try {
      const tokens = await AsyncStorage.getItem(this.TOKENS_KEY);
      return tokens ? JSON.parse(tokens) : null;
    } catch (error) {
      console.error('Erro ao recuperar tokens:', error);
      return null;
    }
  }

  async clearTokens() {
    try {
      await AsyncStorage.removeItem(this.TOKENS_KEY);
      return true;
    } catch (error) {
      console.error('Erro ao limpar tokens:', error);
      return false;
    }
  }

  // Documents
  async saveDocument(document) {
    try {
      // Se não tiver ID, gerar um ID temporário local
      if (!document.id) {
        document.id = `local_${uuidv4()}`;
        document.isLocal = true;
      }

      // Adicionar timestamp
      document.updatedAt = new Date().toISOString();
      
      // Salvar o documento individualmente
      await AsyncStorage.setItem(
        `${this.DOCUMENT_PREFIX}${document.id}`, 
        JSON.stringify(document)
      );

      // Atualizar o índice de documentos
      const docIndex = await this.getDocumentIndex();
      
      // Se o documento já existe no índice, atualizá-lo
      const existingIndex = docIndex.findIndex(doc => doc.id === document.id);
      
      if (existingIndex >= 0) {
        docIndex[existingIndex] = {
          id: document.id,
          title: document.title,
          updatedAt: document.updatedAt,
          isLocal: document.isLocal || false
        };
      } else {
        // Adicionar ao índice se não existe
        docIndex.push({
          id: document.id,
          title: document.title,
          updatedAt: document.updatedAt,
          isLocal: document.isLocal || false
        });
      }
      
      // Salvar índice atualizado
      await AsyncStorage.setItem(this.DOCUMENTS_KEY, JSON.stringify(docIndex));
      
      // Se o documento tiver sido modificado, adicionar à fila de sincronização
      if (!document.isLocal) {
        await this.addToSyncQueue({
          type: 'update',
          documentId: document.id,
          timestamp: document.updatedAt
        });
      }
      
      return document;
    } catch (error) {
      console.error('Erro ao salvar documento:', error);
      throw error;
    }
  }

  async getDocument(id) {
    try {
      const docString = await AsyncStorage.getItem(`${this.DOCUMENT_PREFIX}${id}`);
      return docString ? JSON.parse(docString) : null;
    } catch (error) {
      console.error(`Erro ao recuperar documento ${id}:`, error);
      return null;
    }
  }

  async getAllDocuments() {
    try {
      // Obter o índice de documentos
      const docIndex = await this.getDocumentIndex();
      
      // Ordenar por data de atualização (mais recente primeiro)
      docIndex.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      
      return docIndex;
    } catch (error) {
      console.error('Erro ao listar documentos:', error);
      return [];
    }
  }
  
  async getDocumentIndex() {
    try {
      const index = await AsyncStorage.getItem(this.DOCUMENTS_KEY);
      return index ? JSON.parse(index) : [];
    } catch (error) {
      console.error('Erro ao obter índice de documentos:', error);
      return [];
    }
  }

  async deleteDocument(id) {
    try {
      // Remover o documento
      await AsyncStorage.removeItem(`${this.DOCUMENT_PREFIX}${id}`);
      
      // Atualizar o índice
      const docIndex = await this.getDocumentIndex();
      const updatedIndex = docIndex.filter(doc => doc.id !== id);
      await AsyncStorage.setItem(this.DOCUMENTS_KEY, JSON.stringify(updatedIndex));
      
      // Se for um documento sincronizado (não local), adicionar à fila para remoção no servidor
      const isLocalId = id.startsWith('local_');
      if (!isLocalId) {
        await this.addToSyncQueue({
          type: 'delete',
          documentId: id,
          timestamp: new Date().toISOString()
        });
      }
      
      return true;
    } catch (error) {
      console.error(`Erro ao excluir documento ${id}:`, error);
      return false;
    }
  }

  // Sync queue
  async addToSyncQueue(operation) {
    try {
      const queueStr = await AsyncStorage.getItem(this.SYNC_QUEUE_KEY);
      const queue = queueStr ? JSON.parse(queueStr) : [];
      
      // Verificar se já existe uma operação para o mesmo documento
      const existingOpIndex = queue.findIndex(
        op => op.documentId === operation.documentId && op.type === operation.type
      );
      
      if (existingOpIndex >= 0) {
        // Se existe, atualizar com a operação mais recente
        queue[existingOpIndex] = operation;
      } else {
        // Se não existe, adicionar à fila
        queue.push(operation);
      }
      
      await AsyncStorage.setItem(this.SYNC_QUEUE_KEY, JSON.stringify(queue));
      return true;
    } catch (error) {
      console.error('Erro ao adicionar à fila de sincronização:', error);
      return false;
    }
  }

  async getSyncQueue() {
    try {
      const queueStr = await AsyncStorage.getItem(this.SYNC_QUEUE_KEY);
      return queueStr ? JSON.parse(queueStr) : [];
    } catch (error) {
      console.error('Erro ao recuperar fila de sincronização:', error);
      return [];
    }
  }

  async removeFromSyncQueue(documentId, type) {
    try {
      const queue = await this.getSyncQueue();
      const updatedQueue = queue.filter(
        op => !(op.documentId === documentId && op.type === type)
      );
      await AsyncStorage.setItem(this.SYNC_QUEUE_KEY, JSON.stringify(updatedQueue));
      return true;
    } catch (error) {
      console.error('Erro ao remover da fila de sincronização:', error);
      return false;
    }
  }

  async clearSyncQueue() {
    try {
      await AsyncStorage.removeItem(this.SYNC_QUEUE_KEY);
      return true;
    } catch (error) {
      console.error('Erro ao limpar fila de sincronização:', error);
      return false;
    }
  }
  
  // Versioning
  async saveDocumentVersion(document) {
    try {
      // Criar uma nova versão com timestamp
      const version = {
        ...document,
        versionId: uuidv4(),
        versionDate: new Date().toISOString()
      };
      
      // Obter versões existentes
      const versions = await this.getDocumentVersions(document.id);
      versions.push(version);
      
      // Manter apenas as últimas 10 versões
      const latestVersions = versions.sort(
        (a, b) => new Date(b.versionDate) - new Date(a.versionDate)
      ).slice(0, 10);
      
      // Salvar versões atualizadas
      await AsyncStorage.setItem(
        `${this.DOCUMENT_PREFIX}${document.id}_versions`,
        JSON.stringify(latestVersions)
      );
      
      return true;
    } catch (error) {
      console.error('Erro ao salvar versão do documento:', error);
      return false;
    }
  }
  
  async getDocumentVersions(documentId) {
    try {
      const versionsStr = await AsyncStorage.getItem(
        `${this.DOCUMENT_PREFIX}${documentId}_versions`
      );
      return versionsStr ? JSON.parse(versionsStr) : [];
    } catch (error) {
      console.error(`Erro ao recuperar versões do documento ${documentId}:`, error);
      return [];
    }
  }
}

export default new StorageService();
