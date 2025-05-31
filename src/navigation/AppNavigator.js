import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { useSelector, useDispatch } from "react-redux";
import MainNavigator from "./MainNavigator";
import AuthNavigator from "./AuthNavigator";
import { restoreAuthState } from "../store/authSlice";
import Loading from "../components/common/Loading";
import StorageService from "../services/storage";
import SocketService from "../services/socket";

const AppNavigator = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, isInitialized, loading, token: reduxToken } = useSelector(
    (state) => state.auth
  );
  const [initializing, setInitializing] = useState(true);
  const [token, setToken] = useState(reduxToken);

  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        const tokens = await StorageService.getTokens();
        if (tokens && tokens.accessToken) {
          // Guardar token localmente para usar na conexão do socket
          setToken(tokens.accessToken);
          // Temos tokens armazenados, vamos restaurar o estado
          await dispatch(restoreAuthState()).unwrap();
        }
      } catch (error) {
        console.error("Erro ao restaurar autenticação:", error);
      } finally {
        setInitializing(false);
      }
    };

    bootstrapAsync();
  }, [dispatch]);

  // Atualizar token quando mudar no Redux
  useEffect(() => {
    if (reduxToken) {
      setToken(reduxToken);
    }
  }, [reduxToken]);


  // Mostrar loading enquanto verifica autenticação
  if (initializing || (loading && !isInitialized)) {
    return <Loading />;
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};

export default AppNavigator;
