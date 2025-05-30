import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  StatusBar,
  Alert,
  SafeAreaView,
  ScrollView
} from 'react-native';
import { useDispatch } from 'react-redux';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

// Components
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

// Services
import ApiService from '../../services/api';
import StorageService from '../../services/storage';
import SocketService from '../../services/socket';

// Actions
import { register } from '../../store/authSlice';

const RegisterScreen = ({ navigation }) => {
  const dispatch = useDispatch();

  // Estado do formulário
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [avatar, setAvatar] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Verificar se o formulário está válido para habilitar o botão
  const [isFormValid, setIsFormValid] = useState(false);

  // Função para verificar a validade do formulário em tempo real
  const checkFormValidity = () => {
    // Verificar nome de usuário
    if (!username || username.length < 3) return false;
    
    // Verificar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) return false;
    
    // Verificar senha
    if (!password || password.length < 6) return false;
    
    // Verificar confirmação de senha
    if (password !== confirmPassword) return false;
    
    // Verificar termos
    if (!acceptTerms) return false;
    
    return true;
  };

  // Atualizar estado de validade do formulário quando os campos mudarem
  useEffect(() => {
    setIsFormValid(checkFormValidity());
  }, [username, email, password, confirmPassword, acceptTerms]);

  // Seleção de avatar
  const handleSelectAvatar = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permissão negada', 'Precisamos da permissão para acessar sua galeria de fotos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'Images',
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setAvatar(result.assets[0]);
      }
    } catch (error) {
      console.error('Erro ao selecionar avatar:', error);
      Alert.alert('Erro', 'Não foi possível selecionar a imagem. Tente novamente.');
    }
  };

  // Validação do formulário
  const validateForm = () => {
    const newErrors = {};

    // Validar nome de usuário
    if (!username) {
      newErrors.username = 'Nome de usuário é obrigatório';
    } else if (username.length < 3) {
      newErrors.username = 'Nome de usuário deve ter pelo menos 3 caracteres';
    }

    // Validar email
    if (!email) {
      newErrors.email = 'Email é obrigatório';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        newErrors.email = 'Digite um email válido';
      }
    }

    // Validar senha
    if (!password) {
      newErrors.password = 'Senha é obrigatória';
    } else if (password.length < 6) {
      newErrors.password = 'A senha deve ter pelo menos 6 caracteres';
    }

    // Validar confirmação de senha
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'As senhas não correspondem';
    }

    // Validar termos
    if (!acceptTerms) {
      newErrors.terms = 'Você deve aceitar os termos e condições';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Função de registro
  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      // Preparar dados do usuário
      const userData = {
        username,
        email,
        password
      };

      // Se houver avatar, formatar para envio
      if (avatar) {
        // Criar um form data se necessário para upload de imagem
        // ou processar a imagem conforme necessário pela API
        // Exemplo simples: userData.avatar = avatar.uri;
        
        // Upload da imagem usando FormData se a API suportar
        const formData = new FormData();
        formData.append('avatar', {
          uri: avatar.uri,
          type: 'image/jpeg',
          name: 'avatar.jpg'
        });
        
        try {
          const uploadResponse = await ApiService.uploadAvatar(formData);
          if (uploadResponse && uploadResponse.imageUrl) {
            userData.avatar = uploadResponse.imageUrl;
          }
        } catch (uploadError) {
          console.error('Erro no upload do avatar:', uploadError);
          // Continuar sem avatar se falhar
        }
      }

      // Chamada à API
      const response = await ApiService.register(userData);

      // Processar resposta
      if (response && response.accessToken) {
        // Salvar tokens
        await StorageService.setTokens(response.accessToken, response.refreshToken);
        
        // Configurar token no ApiService para futuras requisições
        ApiService.setAuthToken(response.accessToken, response.refreshToken);
        
        // Salvar dados do usuário
        await StorageService.setUserData(response.user);
        
        // Conectar ao socket
        SocketService.connect(response.accessToken);
        
        // Dispatch para o Redux
        dispatch(register({
          user: response.user,
          token: response.accessToken,
          refreshToken: response.refreshToken
        }));
        
        Alert.alert(
          'Bem-vindo!',
          'Seu cadastro foi realizado com sucesso.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Erro', 'Não foi possível criar sua conta. Tente novamente.');
      }
    } catch (error) {
      console.error('Erro no registro:', error);
      
      // Mensagem de erro personalizada
      let errorMessage = 'Erro ao criar sua conta. Por favor, tente novamente.';
      
      if (error.response) {
        if (error.response.status === 409) {
          errorMessage = 'Este email ou nome de usuário já está em uso.';
        } else if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      }
      
      Alert.alert('Erro', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Botão de voltar */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Feather name="arrow-left" size={24} color="#333" />
            </TouchableOpacity>
            
            {/* Cabeçalho */}
            <View style={styles.header}>
              <Text style={styles.title}>Criar Conta</Text>
              <Text style={styles.subtitle}>
                Preencha os dados abaixo para criar sua conta
              </Text>
            </View>

            {/* Avatar */}
            <TouchableOpacity
              style={styles.avatarContainer}
              onPress={handleSelectAvatar}
            >
              {avatar ? (
                <Image
                  source={{ uri: avatar.uri }}
                  style={styles.avatar}
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Feather name="camera" size={32} color="#999" />
                  <Text style={styles.avatarText}>Adicionar foto</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Formulário de Cadastro */}
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nome de usuário</Text>
                <Input
                  value={username}
                  onChangeText={(text) => {
                    setUsername(text);
                    if (errors.username) setErrors({...errors, username: null});
                  }}
                  placeholder="Escolha um nome de usuário"
                  autoCapitalize="none"
                  leftIcon="user"
                  error={errors.username}
                />
                {errors.username && (
                  <Text style={styles.errorText}>{errors.username}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <Input
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (errors.email) setErrors({...errors, email: null});
                  }}
                  placeholder="seu.email@exemplo.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  leftIcon="mail"
                  error={errors.email}
                />
                {errors.email && (
                  <Text style={styles.errorText}>{errors.email}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Senha</Text>
                <Input
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errors.password) setErrors({...errors, password: null});
                  }}
                  placeholder="Crie uma senha forte"
                  secureTextEntry={!showPassword}
                  leftIcon="lock"
                  rightIcon={showPassword ? "eye-off" : "eye"}
                  onRightIconPress={() => setShowPassword(!showPassword)}
                  error={errors.password}
                />
                {errors.password && (
                  <Text style={styles.errorText}>{errors.password}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirmar Senha</Text>
                <Input
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    if (errors.confirmPassword) setErrors({...errors, confirmPassword: null});
                  }}
                  placeholder="Confirme sua senha"
                  secureTextEntry={!showPassword}
                  leftIcon="lock"
                  error={errors.confirmPassword}
                />
                {errors.confirmPassword && (
                  <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                )}
              </View>

              {/* Termos e condições */}
              <TouchableOpacity
                style={styles.termsContainer}
                onPress={() => {
                  setAcceptTerms(!acceptTerms);
                  if (errors.terms) setErrors({...errors, terms: null});
                }}
              >
                <View style={[
                  styles.checkbox,
                  acceptTerms && styles.checkboxActive
                ]}>
                  {acceptTerms && (
                    <Feather name="check" size={14} color="#fff" />
                  )}
                </View>
                <Text style={styles.termsText}>
                  Aceito os{' '}
                  <Text style={styles.termsLink}>termos de serviço</Text> e a{' '}
                  <Text style={styles.termsLink}>política de privacidade</Text>
                </Text>
              </TouchableOpacity>
              {errors.terms && (
                <Text style={styles.errorText}>{errors.terms}</Text>
              )}

              <Button
                title="Criar conta"
                onPress={handleRegister}
                style={styles.registerButton}
                loading={isLoading}
                disabled={!isFormValid} // Desabilitar botão se o formulário não for válido
                variant="confirm" // Novo estilo de botão de confirmação
              />

              <View style={styles.loginContainer}>
                <Text style={styles.loginText}>Já tem uma conta?</Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate('Login')}
                >
                  <Text style={styles.loginLink}>Entrar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff'
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  backButton: {
    marginTop: 16,
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  header: {
    marginTop: 24,
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  avatarContainer: {
    alignSelf: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#e0e0e0',
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
  },
  avatarText: {
    marginTop: 8,
    fontSize: 12,
    color: '#999',
  },
  form: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#f44336',
    marginTop: 4,
    marginLeft: 4,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#ddd',
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: '#2196f3',
    borderColor: '#2196f3',
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
  },
  termsLink: {
    color: '#2196f3',
    fontWeight: '500',
  },
  registerButton: {
    marginTop: 8,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  loginText: {
    color: '#666',
    marginRight: 4,
  },
  loginLink: {
    color: '#2196f3',
    fontWeight: 'bold',
  }
});

export default RegisterScreen;
