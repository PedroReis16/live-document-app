import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
  Switch,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

// Components
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

// Redux actions
import { logout, updateUserProfile } from '../../store/authSlice';

const ProfileScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { user, loading } = useSelector(state => state.auth);
  
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    bio: '',
    notifications: true,
    darkMode: false,
    profileImage: null
  });
  const [imageLoading, setImageLoading] = useState(false);

  // Carregar dados do usuário
  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        bio: user.bio || '',
        notifications: user.preferences?.notifications ?? true,
        darkMode: user.preferences?.darkMode ?? false,
        profileImage: user.profileImage || null
      });
    } else {
      // Definir valores padrão caso o usuário não esteja disponível
      setProfileData({
        name: '',
        email: '',
        bio: '',
        notifications: true,
        darkMode: false,
        profileImage: null
      });
    }
  }, [user]);

  // Função para atualizar dados do perfil
  const handleUpdateProfile = async () => {
    try {
      await dispatch(updateUserProfile(profileData)).unwrap();
      Alert.alert('Sucesso', 'Perfil atualizado com sucesso');
      setIsEditing(false);
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      Alert.alert('Erro', 'Não foi possível atualizar o perfil. Tente novamente.');
    }
  };

  // Função para selecionar imagem de perfil
  const handleSelectImage = async () => {
    try {
      setImageLoading(true);
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permissão negada', 'É necessário permitir o acesso à galeria de imagens.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'Images',
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const selectedImage = result.assets[0];
        
        // Limite de 2MB
        const fileInfo = await FileSystem.getInfoAsync(selectedImage.uri);
        if (fileInfo.size > 2 * 1024 * 1024) {
          Alert.alert('Imagem muito grande', 'Selecione uma imagem de até 2MB.');
          return;
        }

        setProfileData({
          ...profileData,
          profileImage: {
            uri: selectedImage.uri,
            type: 'image/jpeg',
            name: 'profile-image.jpg'
          }
        });
      }
    } catch (error) {
      console.error('Erro ao selecionar imagem:', error);
      Alert.alert('Erro', 'Não foi possível selecionar a imagem. Tente novamente.');
    } finally {
      setImageLoading(false);
    }
  };

  // Função para fazer logout
  const handleLogout = async () => {
    Alert.alert(
      'Sair da conta',
      'Tem certeza que deseja sair da sua conta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Sair', 
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(logout()).unwrap();
            } catch (error) {
              console.error('Erro ao fazer logout:', error);
            }
          }
        }
      ]
    );
  };

  const ProfileImage = () => (
    <View style={styles.imageContainer}>
      {imageLoading ? (
        <ActivityIndicator size="large" color="#2196f3" />
      ) : profileData.profileImage ? (
        <Image
          source={{ uri: typeof profileData.profileImage === 'string' 
            ? profileData.profileImage 
            : profileData.profileImage.uri }}
          style={styles.profileImage}
        />
      ) : (
        <View style={styles.placeholderImage}>
          <Feather name="user" size={50} color="#999" />
        </View>
      )}
      
      {isEditing && (
        <TouchableOpacity 
          style={styles.changeImageButton}
          onPress={handleSelectImage}
        >
          <Feather name="camera" size={16} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor="#fff" barStyle="dark-content" />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Cabeçalho */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Meu Perfil</Text>
          {!isEditing && (
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => setIsEditing(true)}
            >
              <Feather name="edit-2" size={20} color="#2196f3" />
            </TouchableOpacity>
          )}
        </View>
        
        {/* Imagem de perfil */}
        <ProfileImage />
        
        {/* Nome de usuário */}
        <Text style={styles.nameText}>
          {user?.name || 'Usuário'}
        </Text>
        
        {/* Formulário de perfil */}
        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nome</Text>
            <Input
              value={profileData.name}
              onChangeText={(text) => setProfileData({...profileData, name: text})}
              placeholder="Seu nome completo"
              editable={isEditing}
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <Input
              value={profileData.email}
              onChangeText={(text) => setProfileData({...profileData, email: text})}
              placeholder="seu.email@exemplo.com"
              keyboardType="email-address"
              editable={false} // Email não pode ser editado
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Bio</Text>
            <Input
              value={profileData.bio}
              onChangeText={(text) => setProfileData({...profileData, bio: text})}
              placeholder="Conte um pouco sobre você..."
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              editable={isEditing}
              style={styles.bioInput}
            />
          </View>
          
          {/* Preferências */}
          <View style={styles.preferencesContainer}>
            <Text style={styles.sectionTitle}>Preferências</Text>
            
            <View style={styles.preferenceItem}>
              <Text style={styles.preferenceLabel}>Notificações</Text>
              <Switch
                value={profileData.notifications}
                onValueChange={(value) => 
                  isEditing && setProfileData({...profileData, notifications: value})
                }
                disabled={!isEditing}
                trackColor={{ false: '#e0e0e0', true: '#bbdefb' }}
                thumbColor={profileData.notifications ? '#2196f3' : '#f5f5f5'}
              />
            </View>
            
            <View style={styles.preferenceItem}>
              <Text style={styles.preferenceLabel}>Modo escuro</Text>
              <Switch
                value={profileData.darkMode}
                onValueChange={(value) => 
                  isEditing && setProfileData({...profileData, darkMode: value})
                }
                disabled={!isEditing}
                trackColor={{ false: '#e0e0e0', true: '#bbdefb' }}
                thumbColor={profileData.darkMode ? '#2196f3' : '#f5f5f5'}
              />
            </View>
          </View>
        </View>
        
        {/* Botões de ação */}
        <View style={styles.actionsContainer}>
          {isEditing ? (
            <>
              <Button
                title="Salvar alterações"
                onPress={handleUpdateProfile}
                loading={loading}
                style={styles.saveButton}
              />
              <Button
                title="Cancelar"
                onPress={() => {
                  // Restaurar dados originais
                  if (user) {
                    setProfileData({
                      name: user.name || '',
                      email: user.email || '',
                      bio: user.bio || '',
                      notifications: user.preferences?.notifications ?? true,
                      darkMode: user.preferences?.darkMode ?? false,
                      profileImage: user.profileImage || null
                    });
                  }
                  setIsEditing(false);
                }}
                style={styles.cancelButton}
                textColor="#666"
                outlined
              />
            </>
          ) : (
            <Button
              title="Sair da conta"
              onPress={handleLogout}
              style={styles.logoutButton}
              textColor="#f44336"
              outlined
              icon={<Feather name="log-out" size={16} color="#f44336" />}
            />
          )}
        </View>
        
        {/* Versão do app */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>
            Document App v1.0.0
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f9ff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  imageContainer: {
    alignSelf: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#e0e0e0',
  },
  placeholderImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  changeImageButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#2196f3',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  nameText: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
    color: '#333',
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  bioInput: {
    height: 100,
  },
  preferencesContainer: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  preferenceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  preferenceLabel: {
    fontSize: 16,
    color: '#333',
  },
  actionsContainer: {
    marginBottom: 24,
  },
  saveButton: {
    marginBottom: 12,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  logoutButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#ffcdd2',
  },
  versionContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  versionText: {
    color: '#999',
    fontSize: 12,
  },
});

export default ProfileScreen;