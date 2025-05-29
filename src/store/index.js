import { configureStore } from "@reduxjs/toolkit";
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Importar os slices
import authSlice from "./authSlice";
import documentsSlice from "./documentsSlice";
import shareSlice from "./shareSlice";

// Configuração de persistência
const persistConfig = {
  key: "root",
  storage: AsyncStorage,
  whitelist: ["auth", "documents"], // Apenas auth e documents serão persistidos
  blacklist: ["share"], // share não será persistido (dados temporários)
};

// Combinar reducers
const rootReducer = {
  auth: authSlice.reducer,
  documents: documentsSlice.reducer,
  share: shareSlice.reducer,
};

// Aplicar persistência ao reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Configurar store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignorar actions do redux-persist
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
  devTools: __DEV__, // Habilitar Redux DevTools apenas em desenvolvimento
});

// Configurar persistor
export const persistor = persistStore(store);

// Typed hooks para usar no app
import { useDispatch, useSelector } from "react-redux";
export const useAppDispatch = () => useDispatch();
export const useAppSelector = (selector) => useSelector(selector);

// Action para limpar todo o store (útil no logout)
export const clearStore = () => {
  return {
    type: "CLEAR_STORE",
  };
};

// Middleware customizado para limpar store
const rootReducerWithClear = (state, action) => {
  if (action.type === "CLEAR_STORE") {
    // Limpar AsyncStorage
    // Middleware customizado para limpar store
    const rootReducerWithClear = (state, action) => {
      if (action.type === "CLEAR_STORE") {
        // Limpar AsyncStorage
        AsyncStorage.clear();
        // Resetar state
        state = undefined;
      }
      return persistedReducer(state, action);
    };
  }
};
return persistedReducer(state, action);
