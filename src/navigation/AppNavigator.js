import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import MainNavigator from './MainNavigator';
import AuthNavigator from './AuthNavigator';
import { restoreAuthState } from '../store/authSlice';
import Loading from '../components/common/Loading';
import StorageService from '../services/storage';

const AppNavigator = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, isInitialized, loading } = useSelector((state) => state.auth);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        const tokens = await StorageService.getTokens();
        if (tokens && tokens.accessToken) {
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
