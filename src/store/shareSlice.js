const shareSlice = createSlice({
  name: "share",
  initialState: {
    shareCode: null,
    collaborators: [],
    loading: false,
    error: null,
  },
  reducers: {
    setShareCode: (state, action) => {
      state.shareCode = action.payload;
    },
    setCollaborators: (state, action) => {
      state.collaborators = action.payload;
    },
    addCollaborator: (state, action) => {
      state.collaborators.push(action.payload);
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
  },
});
