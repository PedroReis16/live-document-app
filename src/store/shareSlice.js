import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import ShareService from '../services/share';

// Async thunks
export const generateShareCode = createAsyncThunk(
  'share/generateCode',
  async (documentId, { rejectWithValue }) => {
    try {
      const response = await ShareService.generateShareCode(documentId);
      return response;
    } catch (error) {
      return rejectWithValue(error.message || 'Erro ao gerar código de compartilhamento');
    }
  }
);

export const joinSharedDocument = createAsyncThunk(
  'share/joinDocument',
  async (shareCode, { rejectWithValue }) => {
    try {
      const response = await ShareService.joinWithCode(shareCode);
      return response;
    } catch (error) {
      return rejectWithValue(error.message || 'Código de compartilhamento inválido ou expirado');
    }
  }
);

export const fetchCollaborators = createAsyncThunk(
  'share/fetchCollaborators',
  async (documentId, { rejectWithValue }) => {
    try {
      const collaborators = await ShareService.getCollaborators(documentId);
      return { documentId, collaborators };
    } catch (error) {
      return rejectWithValue(error.message || 'Erro ao buscar colaboradores');
    }
  }
);

export const updatePermission = createAsyncThunk(
  'share/updatePermission',
  async ({ documentId, userId, permission }, { rejectWithValue }) => {
    try {
      await ShareService.updateCollaboratorPermission(documentId, userId, permission);
      return { userId, permission };
    } catch (error) {
      return rejectWithValue(error.message || 'Erro ao atualizar permissão');
    }
  }
);

export const removeCollaborator = createAsyncThunk(
  'share/removeCollaborator',
  async ({ documentId, userId }, { rejectWithValue }) => {
    try {
      await ShareService.removeCollaborator(documentId, userId);
      return { userId };
    } catch (error) {
      return rejectWithValue(error.message || 'Erro ao remover colaborador');
    }
  }
);

const shareSlice = createSlice({
  name: "share",
  initialState: {
    shareCode: null,
    shareCodeExpiration: null,
    collaborators: [],
    loading: false,
    error: null,
    currentDocumentId: null,
  },
  reducers: {
    setShareCode: (state, action) => {
      state.shareCode = action.payload.code;
      state.shareCodeExpiration = action.payload.expiration;
    },
    setCollaborators: (state, action) => {
      state.collaborators = action.payload;
    },
    addCollaborator: (state, action) => {
      // Verificar se já existe
      const exists = state.collaborators.some(c => c.id === action.payload.id);
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
    setCurrentDocument: (state, action) => {
      state.currentDocumentId = action.payload;
    },
    clearShareData: (state) => {
      state.shareCode = null;
      state.shareCodeExpiration = null;
      state.collaborators = [];
      state.currentDocumentId = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Generate share code
      .addCase(generateShareCode.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(generateShareCode.fulfilled, (state, action) => {
        state.loading = false;
        state.shareCode = action.payload.shareCode;
        state.shareCodeExpiration = action.payload.expiration;
      })
      .addCase(generateShareCode.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Join shared document
      .addCase(joinSharedDocument.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(joinSharedDocument.fulfilled, (state, action) => {
        state.loading = false;
        state.currentDocumentId = action.payload.documentId;
      })
      .addCase(joinSharedDocument.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch collaborators
      .addCase(fetchCollaborators.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCollaborators.fulfilled, (state, action) => {
        state.loading = false;
        state.collaborators = action.payload.collaborators;
        state.currentDocumentId = action.payload.documentId;
      })
      .addCase(fetchCollaborators.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Update permissions
      .addCase(updatePermission.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updatePermission.fulfilled, (state, action) => {
        state.loading = false;
        const { userId, permission } = action.payload;
        const collaborator = state.collaborators.find(c => c.id === userId);
        if (collaborator) {
          collaborator.permission = permission;
        }
      })
      .addCase(updatePermission.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Remove collaborator
      .addCase(removeCollaborator.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeCollaborator.fulfilled, (state, action) => {
        state.loading = false;
        state.collaborators = state.collaborators.filter(
          c => c.id !== action.payload.userId
        );
      })
      .addCase(removeCollaborator.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { 
  setShareCode, 
  setCollaborators, 
  addCollaborator, 
  removeCollaborator: removeCollaboratorAction, 
  updateCollaboratorStatus,
  setCurrentDocument,
  clearShareData
} = shareSlice.actions;

export default shareSlice;
