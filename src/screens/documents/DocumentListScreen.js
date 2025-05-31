import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Alert,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';

// Components
import DocumentItem from '../../components/document/DocumentItem';
import Button from '../../components/common/Button';

// Actions
import { fetchDocuments, deleteDocument } from '../../store/documentSlice';

// Service
import DocumentService from '../../services/documents';

const DocumentListScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { documents, loading } = useSelector(state => state.documents);

  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'my', 'shared'
  const [filteredDocuments, setFilteredDocuments] = useState([]);

  // Efeito para filtrar documentos baseado na busca e aba ativa
  useEffect(() => {
    // Verificar se documents existe e é um array
    if (documents && Array.isArray(documents)) {
      let filtered = [...documents];
      
      // Filtrar por texto de busca
      if (searchText) {
        filtered = filtered.filter(doc => 
          doc.title.toLowerCase().includes(searchText.toLowerCase())
        );
      }
      
      // Filtrar por tipo (meus ou compartilhados)
      if (activeTab === 'my') {
        filtered = filtered.filter(doc => !doc.shared);
      } else if (activeTab === 'shared') {
        filtered = filtered.filter(doc => doc.shared);
      }
      
      // Ordenar por data de atualização (mais recentes primeiro)
      filtered.sort((a, b) => {
        return new Date(b.updatedAt) - new Date(a.updatedAt);
      });
      
      setFilteredDocuments(filtered);
    } else {
      // Se documents não for um array válido, inicializar filteredDocuments como array vazio
      setFilteredDocuments([]);
    }
  }, [documents, searchText, activeTab]);

  // Carregar documentos ao montar o componente
  useEffect(() => {
    loadDocuments();
  }, []);

  // Função para carregar documentos
  const loadDocuments = async () => {
    setRefreshing(true);
    try {
      await dispatch(fetchDocuments()).unwrap();
    } catch (error) {
      console.error('Erro ao carregar documentos:', error);
      Alert.alert('Erro', 'Não foi possível carregar seus documentos. Tente novamente.');
    } finally {
      setRefreshing(false);
    }
  };

  // Função para criar novo documento
  const handleCreateDocument = () => {
    // Criar documento vazio e navegar para a tela de edição
    const newDocument = {
      id: `local_${Date.now()}`, // Gera um ID temporário local
      title: 'Novo documento',
      content: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: user?.id,
    };
    
    // Tentar criar no servidor, com fallback para criação local
    DocumentService.createDocument(newDocument)
      .then(createdDoc => {
        // Redirecionar para a tela de edição com o ID do novo documento
        navigation.navigate('DocumentEdit', {
          documentId: createdDoc.id || newDocument.id,
          isSharedDocument: false
        });
      })
      .catch(error => {
        console.error('Erro ao criar documento no servidor, usando versão local:', error);
        
        // Mesmo com erro no servidor, ainda navega para tela de edição com documento local
        navigation.navigate('DocumentEdit', {
          documentId: newDocument.id,
          isNewDocument: true, // Indica que é um novo documento (ainda não salvo no servidor)
          documentData: newDocument // Passa os dados diretamente para evitar outra chamada à API
        });
      });
  };

  // Função para lidar com o clique em um documento
  const handleDocumentPress = (document) => {
    navigation.navigate('DocumentView', {
      documentId: document.id,
      isSharedDocument: document.shared || false
    });
  };

  // Função para compartilhar documento
  const handleShareDocument = (document) => {
    navigation.navigate('Share', { documentId: document.id });
  };

  // Função para excluir documento
  const handleDeleteDocument = (document) => {
    Alert.alert(
      'Excluir documento',
      `Tem certeza que deseja excluir "${document.title}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Excluir', 
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(deleteDocument(document.id)).unwrap();
              Alert.alert('Sucesso', 'Documento excluído com sucesso.');
            } catch (error) {
              console.error('Erro ao excluir documento:', error);
              Alert.alert('Erro', 'Não foi possível excluir o documento. Tente novamente.');
            }
          }
        }
      ]
    );
  };

  // Renderizar um item da lista
  const renderItem = ({ item }) => (
    <DocumentItem 
      document={item}
      onLongPress={handleDocumentPress}
      onDelete={handleDeleteDocument}
      onShare={handleShareDocument}
    />
  );

  // Renderizar componente de estado vazio
  const renderEmptyComponent = () => {
    if (loading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color="#2196f3" />
          <Text style={styles.emptyText}>Carregando documentos...</Text>
        </View>
      );
    }

    let message = 'Você não possui documentos.';
    if (activeTab === 'shared') {
      message = 'Não há documentos compartilhados com você.';
    } else if (searchText) {
      message = 'Nenhum documento encontrado com esse termo.';
    }

    return (
      <View style={styles.emptyContainer}>
        <Feather name="file-text" size={64} color="#ccc" />
        <Text style={styles.emptyText}>{message}</Text>
        {activeTab !== 'shared' && (
          <Button 
            title="Criar novo documento"
            onPress={handleCreateDocument}
            style={styles.createButton}
          />
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor="#fff" barStyle="dark-content" />
      <View style={styles.container}>
        {/* Cabeçalho */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Meus Documentos</Text>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={handleCreateDocument}
          >
            <Feather name="plus" size={24} color="#2196f3" />
          </TouchableOpacity>
        </View>

        {/* Campo de busca */}
        <View style={styles.searchContainer}>
          <Feather name="search" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar documentos..."
            value={searchText}
            onChangeText={setSearchText}
            clearButtonMode="always"
          />
          {searchText !== '' && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Feather name="x" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>

        {/* Abas de filtro */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'all' && styles.activeTabButton
            ]}
            onPress={() => setActiveTab('all')}
          >
            <Text 
              style={[
                styles.tabText,
                activeTab === 'all' && styles.activeTabText
              ]}
            >
              Todos
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'my' && styles.activeTabButton
            ]}
            onPress={() => setActiveTab('my')}
          >
            <Text 
              style={[
                styles.tabText,
                activeTab === 'my' && styles.activeTabText
              ]}
            >
              Meus
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'shared' && styles.activeTabButton
            ]}
            onPress={() => setActiveTab('shared')}
          >
            <Text 
              style={[
                styles.tabText,
                activeTab === 'shared' && styles.activeTabText
              ]}
            >
              Compartilhados
            </Text>
          </TouchableOpacity>
        </View>

        {/* Lista de documentos */}
        <FlatList
          data={filteredDocuments}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={loadDocuments}
              colors={['#2196f3']}
              tintColor="#2196f3"
            />
          }
          ListEmptyComponent={renderEmptyComponent}
          showsVerticalScrollIndicator={false}
        />
      </View>
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
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f0f9ff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
  },
  activeTabButton: {
    backgroundColor: '#e3f2fd',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  activeTabText: {
    fontWeight: 'bold',
    color: '#2196f3',
  },
  list: {
    flexGrow: 1,
    paddingBottom: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  createButton: {
    paddingHorizontal: 24,
  },
});

export default DocumentListScreen;
