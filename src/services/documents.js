import ApiService from './api';
import StorageService from './storage';
import NetInfo from '@react-native-community/netinfo';

class DocumentService {
  constructor() {
    this.api = ApiService;
    this.storage = StorageService;
    this.syncInProgress = false;
  }

  async getDocuments() {
    try {
      // Obter documentos locais primeiro para exibição imediata
      const localDocuments = await this.storage.getAllDocuments();
      
      // Verificar conectividade
      const isConnected = await NetInfo.fetch().then(state => state.isConnected);
      
      if (isConnected) {
        try {
          // Se estiver online, tentar buscar documentos remotos
          const { documents } = await this.api.getDocuments();
          
          // Iniciar sincronização
          await this.syncDocuments(documents, localDocuments);
          
          // Retornar documentos atualizados
          return await this.storage.getAllDocuments();
        } catch (error) {
          console.error('Erro ao buscar documentos remotos:', error);
          // Em caso de erro, retornar documentos locais
          return localDocuments;
        }
      } else {
        // Se offline, retornar apenas documentos locais
        return localDocuments;
      }
    } catch (error) {
      console.error('Erro ao obter documentos:', error);
      throw error;
    }
  }

  async createDocument(data) {
    try {
      // Criar estrutura básica do documento
      const newDocument = {
        title: data.title || 'Documento sem título',
        content: data.content || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...data
      };
      
      // Verificar conectividade
      const isConnected = await NetInfo.fetch().then(state => state.isConnected);
      
      if (isConnected) {
        try {
          // Se estiver online, tentar criar no servidor primeiro
          const response = await this.api.createDocument(newDocument);
          
          // Salvar localmente com ID do servidor
          const serverDocument = {
            ...newDocument,
            id: response.id,
            isLocal: false
          };
          
          await this.storage.saveDocument(serverDocument);
          return serverDocument;
        } catch (error) {
          console.error('Erro ao criar documento remotamente:', error);
          // Em caso de falha, criar localmente com ID temporário
          const localDocument = await this.storage.saveDocument(newDocument);
          return localDocument;
        }
      } else {
        // Se offline, criar localmente com ID temporário
        const localDocument = await this.storage.saveDocument(newDocument);
        return localDocument;
      }
    } catch (error) {
      console.error('Erro ao criar documento:', error);
      throw error;
    }
  }

  async updateDocument(id, changes) {
    try {
      // Buscar documento atual
      const currentDocument = await this.storage.getDocument(id);
      
      if (!currentDocument) {
        throw new Error(`Documento ${id} não encontrado`);
      }
      
      // Criar versão do estado atual antes de modificar
      await this.storage.saveDocumentVersion(currentDocument);
      
      // Aplicar alterações
      const updatedDocument = {
        ...currentDocument,
        ...changes,
        updatedAt: new Date().toISOString()
      };
      
      // Salvar localmente primeiro (otimistic update)
      await this.storage.saveDocument(updatedDocument);
      
      // Verificar conectividade
      const isConnected = await NetInfo.fetch().then(state => state.isConnected);
      const isLocalDocument = id.startsWith('local_');
      
      if (isConnected) {
        try {
          if (isLocalDocument) {
            // Se for documento local e estamos online, tentar criar no servidor
            const { id: localId, isLocal, ...documentData } = updatedDocument;
            const response = await this.api.createDocument(documentData);
            
            // Atualizar com ID do servidor
            const serverDocument = {
              ...updatedDocument,
              id: response.id,
              isLocal: false
            };
            
            // Salvar com novo ID e remover documento local
            await this.storage.saveDocument(serverDocument);
            await this.storage.deleteDocument(localId);
            
            return serverDocument;
          } else {
            // Se não for documento local, apenas atualizar no servidor
            await this.api.updateDocument(id, changes);
            return updatedDocument;
          }
        } catch (error) {
          console.error(`Erro ao sincronizar documento ${id}:`, error);
          // Em caso de erro, manter a atualização local
          return updatedDocument;
        }
      } else {
        // Se offline, retornar documento atualizado localmente
        return updatedDocument;
      }
    } catch (error) {
      console.error(`Erro ao atualizar documento ${id}:`, error);
      throw error;
    }
  }

  async deleteDocument(id) {
    try {
      // Deletar localmente primeiro
      await this.storage.deleteDocument(id);
      
      // Se for um documento local (nunca sincronizado), não precisa fazer nada mais
      if (id.startsWith('local_')) {
        return true;
      }
      
      // Verificar conectividade
      const isConnected = await NetInfo.fetch().then(state => state.isConnected);
      
      if (isConnected) {
        try {
          // Se estiver online, deletar no servidor
          await this.api.deleteDocument(id);
          return true;
        } catch (error) {
          console.error(`Erro ao deletar documento ${id} remotamente:`, error);
          // Em caso de erro, o documento já foi deletado localmente
          // e uma operação de sincronização será adicionada à fila
          return true;
        }
      } else {
        // Se offline, retorna true (já foi deletado localmente e adicionado à fila)
        return true;
      }
    } catch (error) {
      console.error(`Erro ao deletar documento ${id}:`, error);
      throw error;
    }
  }

  async syncDocuments(remoteDocuments = [], localDocuments = []) {
    if (this.syncInProgress) {
      return;
    }
    
    this.syncInProgress = true;
    
    try {
      // 1. Sincronizar documentos locais (não enviados ao servidor)
      const syncQueue = await this.storage.getSyncQueue();
      
      // Processar fila de sincronização
      for (const operation of syncQueue) {
        try {
          if (operation.type === 'update') {
            const localDoc = await this.storage.getDocument(operation.documentId);
            
            if (localDoc) {
              // Se é um documento local (com ID temporário)
              if (localDoc.isLocal) {
                // Criar no servidor
                const { id: localId, isLocal, ...documentData } = localDoc;
                const response = await this.api.createDocument(documentData);
                
                // Atualizar com ID do servidor
                const serverDocument = {
                  ...localDoc,
                  id: response.id,
                  isLocal: false
                };
                
                // Salvar com ID do servidor e deletar versão local
                await this.storage.saveDocument(serverDocument);
                await this.storage.deleteDocument(localId);
              } else {
                // Atualizar no servidor
                const { id, ...changes } = localDoc;
                await this.api.updateDocument(id, changes);
              }
            }
          } else if (operation.type === 'delete') {
            // Deletar no servidor
            await this.api.deleteDocument(operation.documentId);
          }
          
          // Remover da fila após sincronização bem-sucedida
          await this.storage.removeFromSyncQueue(
            operation.documentId, 
            operation.type
          );
        } catch (error) {
          console.error('Erro ao processar operação:', operation, error);
          // Continuar com próxima operação
        }
      }
      
      // 2. Atualizar documentos locais com dados do servidor
      for (const remoteDoc of remoteDocuments) {
        const localDoc = await this.storage.getDocument(remoteDoc.id);
        
        // Se não existe localmente ou o remoto é mais recente, atualizar
        if (!localDoc || new Date(remoteDoc.updatedAt) > new Date(localDoc.updatedAt)) {
          await this.storage.saveDocument({
            ...remoteDoc,
            isLocal: false
          });
        }
      }
      
      // 3. Verificar documentos deletados no servidor
      // Obter IDs dos documentos remotos para verificar deletados
      const remoteIds = remoteDocuments.map(doc => doc.id);
      
      for (const localDoc of localDocuments) {
        // Ignorar documentos locais (nunca sincronizados)
        if (localDoc.isLocal) continue;
        
        // Se não existe mais no servidor, deletar localmente
        if (!remoteIds.includes(localDoc.id)) {
          await this.storage.deleteDocument(localDoc.id);
        }
      }
    } catch (error) {
      console.error('Erro durante sincronização:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  async getDocumentVersions(documentId) {
    return await this.storage.getDocumentVersions(documentId);
  }
  
  async restoreDocumentVersion(documentId, versionId) {
    try {
      // Obter versões do documento
      const versions = await this.storage.getDocumentVersions(documentId);
      
      // Encontrar versão específica
      const version = versions.find(v => v.versionId === versionId);
      
      if (!version) {
        throw new Error('Versão não encontrada');
      }
      
      // Restaurar versão (sem alterar o ID original)
      const currentDoc = await this.storage.getDocument(documentId);
      
      if (!currentDoc) {
        throw new Error('Documento não encontrado');
      }
      
      // Criar versão do estado atual antes de restaurar
      await this.storage.saveDocumentVersion(currentDoc);
      
      // Atualizar documento com dados da versão, mantendo o ID e metadados
      const restoredDoc = {
        ...version,
        id: documentId,
        versionRestored: version.versionId,
        restoredAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Remover metadados de versão
      delete restoredDoc.versionId;
      delete restoredDoc.versionDate;
      
      // Salvar documento restaurado
      return await this.updateDocument(documentId, restoredDoc);
    } catch (error) {
      console.error(`Erro ao restaurar versão do documento ${documentId}:`, error);
      throw error;
    }
  }
  
  async uploadImage(documentId, imageUri) {
    try {
      // Verificar conectividade
      const isConnected = await NetInfo.fetch().then(state => state.isConnected);
      
      if (!isConnected) {
        throw new Error('É necessário estar online para fazer upload de imagens');
      }
      
      // Fazer upload da imagem
      const response = await this.api.uploadImage(documentId, imageUri);
      return response.imageUrl;
    } catch (error) {
      console.error('Erro ao fazer upload de imagem:', error);
      throw error;
    }
  }
}

export default new DocumentService();
