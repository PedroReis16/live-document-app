const documentsSlice = createSlice({
  name: "documents",
  initialState: {
    documents: [],
    currentDocument: null,
    loading: false,
    syncing: false,
    error: null,
    lastSync: null,
  },
  reducers: {
    setDocuments: (state, action) => {
      state.documents = action.payload;
    },
    addDocument: (state, action) => {
      state.documents.unshift(action.payload);
    },
    updateDocument: (state, action) => {
      const index = state.documents.findIndex(
        (doc) => doc.id === action.payload.id
      );
      if (index !== -1) {
        state.documents[index] = action.payload;
      }
    },
    deleteDocument: (state, action) => {
      state.documents = state.documents.filter(
        (doc) => doc.id !== action.payload
      );
    },
    setCurrentDocument: (state, action) => {
      state.currentDocument = action.payload;
    },
    setSyncStatus: (state, action) => {
      state.syncing = action.payload;
    },
  },
});

// Async thunks
export const loadDocuments = createAsyncThunk(
  "documents/load",
  async (_, { getState }) => {
    // Carregar documentos locais e remotos
  }
);

export const createDocument = createAsyncThunk(
  "documents/create",
  async (documentData) => {
    // Criar documento local e sync
  }
);
