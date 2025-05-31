import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import DocumentService from "../services/documents";
import SocketService from "../services/socket";

// Async thunks
export const fetchDocuments = createAsyncThunk(
  "documents/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const response = await DocumentService.getDocuments();
      // Retornar response.data para lidar com o formato correto da resposta
      return response.data || response;
    } catch (error) {
      return rejectWithValue(error.message || "Erro ao carregar documentos");
    }
  }
);

export const fetchDocumentById = createAsyncThunk(
  "documents/fetchById",
  async (id, { rejectWithValue }) => {
    try {
      const document = await DocumentService.getDocument(id);
      return document;
    } catch (error) {
      return rejectWithValue(
        error.message || `Erro ao carregar documento ${id}`
      );
    }
  }
);

export const createDocument = createAsyncThunk(
  "documents/create",
  async (documentData, { rejectWithValue }) => {
    try {
      const document = await DocumentService.createDocument(documentData);
      return document;
    } catch (error) {
      return rejectWithValue(error.message || "Erro ao criar documento");
    }
  }
);

export const updateDocument = createAsyncThunk(
  "documents/update",
  async ({ id, changes }, { rejectWithValue }) => {
    try {
      const document = await DocumentService.updateDocument(id, changes);
      return document;
    } catch (error) {
      return rejectWithValue(
        error.message || `Erro ao atualizar documento ${id}`
      );
    }
  }
);

export const deleteDocument = createAsyncThunk(
  "documents/delete",
  async (id, { rejectWithValue }) => {
    try {
      await DocumentService.deleteDocument(id);
      return { id };
    } catch (error) {
      return rejectWithValue(
        error.message || `Erro ao excluir documento ${id}`
      );
    }
  }
);

export const joinCollaboration = createAsyncThunk(
  "documents/joinCollaboration",
  async (documentId, { rejectWithValue, getState, dispatch }) => {
    try {
      // Obter token do estado de autenticação
      const { auth } = getState();
      if (!auth.token) {
        return rejectWithValue("Usuário não autenticado");
      }

      // Conectar socket se não estiver conectado
      if (!SocketService.isSocketConnected()) {
        SocketService.connect(auth.token);
      }

      // Entrar no documento
      const document = await SocketService.joinDocument(documentId);

      // Configurar listeners para mudanças no documento
      SocketService.onDocumentChange((data) => {
        if (data.changes) {
          dispatch(
            updateDocumentContent({
              id: documentId,
              content: data.changes,
            })
          );
        }
      });

      return document;
    } catch (error) {
      return rejectWithValue(error.message || "Erro ao entrar na colaboração");
    }
  }
);

export const leaveCollaboration = createAsyncThunk(
  "documents/leaveCollaboration",
  async (documentId, { rejectWithValue }) => {
    try {
      if (SocketService.isSocketConnected()) {
        SocketService.leaveDocument(documentId);
      }
      return { id: documentId };
    } catch (error) {
      return rejectWithValue(error.message || "Erro ao sair da colaboração");
    }
  }
);

const documentSlice = createSlice({
  name: "documents",
  initialState: {
    documents: [],
    currentDocument: null,
    loading: false,
    error: null,
    collaborationActive: false,
    collaborators: [],
    documentVersions: [],
    versionLoading: false,
    versionError: null,
  },
  reducers: {
    setCurrentDocument: (state, action) => {
      state.currentDocument = action.payload;
    },
    clearCurrentDocument: (state) => {
      state.currentDocument = null;
    },
    updateDocumentContent: (state, action) => {
      const { id, content } = action.payload;

      // Atualizar documento atual se for o mesmo
      if (state.currentDocument && state.currentDocument.id === id) {
        state.currentDocument.content = content;
      }

      // Atualizar na lista se existir
      if (state.documents) {
        const documentInList = state.documents.find((doc) => doc.id === id);
        if (documentInList) {
          documentInList.content = content;
        }
      }
    },
    setCollaborators: (state, action) => {
      state.collaborators = action.payload;
    },
    addCollaborator: (state, action) => {
      const exists = state.collaborators.some(
        (c) => c.id === action.payload.id
      );
      if (!exists) {
        state.collaborators.push(action.payload);
      }
    },
    removeCollaborator: (state, action) => {
      state.collaborators = state.collaborators.filter(
        (c) => c.id !== action.payload
      );
    },
    updateCollaboratorStatus: (state, action) => {
      const { userId, status } = action.payload;
      const collaborator = state.collaborators.find((c) => c.id === userId);
      if (collaborator) {
        collaborator.status = status;
      }
    },
    setDocumentVersions: (state, action) => {
      state.documentVersions = action.payload;
    },
    clearCollaborationState: (state) => {
      state.collaborationActive = false;
      state.collaborators = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch documents
      .addCase(fetchDocuments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDocuments.fulfilled, (state, action) => {
        state.loading = false;
        
        // Processar a resposta garantindo que os documentos tenham um campo 'id'
        let documents = action.payload;
        
        // Se documents for um objeto com uma propriedade de dados, extrair os documentos
        if (documents && typeof documents === 'object' && documents.documents) {
          documents = documents.documents;
        }
        
        // Garantir que é um array
        if (!Array.isArray(documents)) {
          documents = [];
        }
        
        // Normalizar documentos para garantir que todos tenham um campo 'id'
        state.documents = documents.map(doc => {
          // Se o documento já tiver um campo 'id', usá-lo; caso contrário, usar o '_id'
          if (!doc.id && doc._id) {
            return { ...doc, id: doc._id };
          }
          return doc;
        });
      })
      .addCase(fetchDocuments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch document by ID
      .addCase(fetchDocumentById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDocumentById.fulfilled, (state, action) => {
        state.loading = false;
        
        // Normalizar o documento da mesma forma que nas outras funções
        let document = action.payload;
        
        // Se a resposta tem uma propriedade data, extrair o documento
        if (document && document.data) {
          document = document.data;
        }
        
        // Garantir que o documento tem um campo 'id'
        if (document && !document.id && document._id) {
          document = { ...document, id: document._id };
        }
        
        state.currentDocument = document;
      })
      .addCase(fetchDocumentById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Create document
      .addCase(createDocument.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createDocument.fulfilled, (state, action) => {
        state.loading = false;

        if (!Array.isArray(state.documents)) {
          state.documents = [];
        }

        // Normalizar o documento da mesma forma que na função fetchDocuments
        let newDoc = action.payload;
        
        // Se a resposta tem uma propriedade data, extrair o documento
        if (newDoc && newDoc.data) {
          newDoc = newDoc.data;
        }
        
        // Garantir que o documento tem um campo 'id'
        if (newDoc && !newDoc.id && newDoc._id) {
          newDoc = { ...newDoc, id: newDoc._id };
        }
        
        state.documents.unshift(newDoc);
        state.currentDocument = newDoc;
      })
      .addCase(createDocument.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update document
      .addCase(updateDocument.pending, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(updateDocument.fulfilled, (state, action) => {
        state.loading = false;

        // Normalizar o documento da resposta
        let updatedDoc = action.payload;
        
        // Se a resposta tem uma propriedade data, extrair o documento
        if (updatedDoc && updatedDoc.data) {
          updatedDoc = updatedDoc.data;
        }
        
        // Garantir que o documento tem um campo 'id'
        if (updatedDoc && !updatedDoc.id && updatedDoc._id) {
          updatedDoc = { ...updatedDoc, id: updatedDoc._id };
        }

        // Atualizar na lista se existir
        if (state.documents) {
          const index = state.documents.findIndex(
            (doc) => doc.id === updatedDoc.id
          );
          if (index !== -1) {
            // Atualizar documento existente
            state.documents[index] = updatedDoc;
          } else {
            // Se não encontrou, pode ser um documento que precisa ser adicionado à lista
            state.documents.unshift(updatedDoc);
          }

          // Remover documentos locais com o mesmo título (se existirem)
          if (!updatedDoc.id.startsWith('local_')) {
            state.documents = state.documents.filter(doc => 
              !(doc.id.startsWith('local_') && 
                doc.title === updatedDoc.title && 
                doc.id !== updatedDoc.id)
            );
          }
        }

        // Atualizar documento atual se for o mesmo
        if (
          state.currentDocument &&
          state.currentDocument.id === updatedDoc.id
        ) {
          state.currentDocument = updatedDoc;
        }
      })
      .addCase(updateDocument.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Delete document
      .addCase(deleteDocument.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteDocument.fulfilled, (state, action) => {
        state.loading = false;
        if (state.documents) {
          state.documents = state.documents.filter(
            (doc) => doc.id !== action.payload.id
          );
        }

        // Limpar documento atual se for o mesmo
        if (
          state.currentDocument &&
          state.currentDocument.id === action.payload.id
        ) {
          state.currentDocument = null;
        }
      })
      .addCase(deleteDocument.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Join collaboration
      .addCase(joinCollaboration.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(joinCollaboration.fulfilled, (state) => {
        state.loading = false;
        state.collaborationActive = true;
      })
      .addCase(joinCollaboration.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.collaborationActive = false;
      })

      // Leave collaboration
      .addCase(leaveCollaboration.fulfilled, (state) => {
        state.collaborationActive = false;
        state.collaborators = [];
      });
  },
});

export const {
  setCurrentDocument,
  clearCurrentDocument,
  updateDocumentContent,
  setCollaborators,
  addCollaborator,
  removeCollaborator,
  updateCollaboratorStatus,
  setDocumentVersions,
  clearCollaborationState,
} = documentSlice.actions;

export default documentSlice;
