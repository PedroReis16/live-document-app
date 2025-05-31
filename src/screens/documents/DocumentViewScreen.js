import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Share
} from 'react-native';
import { useSelector } from 'react-redux';
import { Feather } from '@expo/vector-icons';

// Serviços
import DocumentService from '../../services/documents';
import { formatDate } from '../../utils/helpers';

const DocumentViewScreen = ({ route, navigation }) => {
  const { documentId } = route.params || {};
  const { user } = useSelector(state => state.auth);
  
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Carregar documento ao montar o componente
  useEffect(() => {
    if (!documentId) {
      setError('ID do documento não fornecido');
      setLoading(false);
      return;
    }

    loadDocument();
  }, [documentId]);

  // Configurar opções de navegação dinâmicas
  useEffect(() => {
    if (document) {
      navigation.setOptions({
        title: document.title || 'Visualizar Documento',
        headerRight: () => (
          <View style={styles.headerButtons}>
            {document.userId === user?.id && (
              <TouchableOpacity 
                style={styles.headerButton}
                onPress={handleEdit}
              >
                <Feather name="edit-2" size={22} color="#2196f3" />
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={handleShare}
            >
              <Feather name="share-2" size={22} color="#2196f3" />
            </TouchableOpacity>
          </View>
        ),
      });
    }
  }, [document, navigation]);

  // Carregar dados do documento
  const loadDocument = async () => {
    try {
      setLoading(true);
      const data = await DocumentService.getDocument(documentId);
      setDocument(data);
      setError(null);
    } catch (err) {
      console.error('Erro ao carregar documento:', err);
      setError('Não foi possível carregar o documento. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Função para editar o documento
  const handleEdit = () => {
    navigation.navigate('DocumentEdit', {
      documentId: document.id,
      isSharedDocument: false
    });
  };

  // Função para compartilhar o documento
  const handleShare = () => {
    if (document.userId === user?.id) {
      // Se for o dono do documento, navega para a tela de compartilhamento
      navigation.navigate('Share', { documentId: document.id });
    } else {
      // Se for um documento compartilhado, compartilha um link externo
      Share.share({
        message: `Confira este documento: "${document.title}"`,
        url: `app://document/${document.id}`,
      });
    }
  };

  // Renderiza mensagem de erro
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Feather name="alert-circle" size={48} color="#f44336" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={loadDocument}
          >
            <Text style={styles.retryButtonText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Renderiza indicador de carregamento
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196f3" />
          <Text style={styles.loadingText}>Carregando documento...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Verifica se o documento existe
  if (!document) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Feather name="file-minus" size={48} color="#f44336" />
          <Text style={styles.errorText}>
            Documento não encontrado ou você não tem permissão para acessá-lo.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Renderiza o documento
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        {/* Informações do documento */}
        <View style={styles.documentInfo}>
          <Text style={styles.documentTitle}>{document.title}</Text>
          <View style={styles.metaInfo}>
            <Text style={styles.metaText}>
              {document.userId === user?.id ? 'Você' : document.userName}
            </Text>
            <Text style={styles.metaDot}>•</Text>
            <Text style={styles.metaText}>
              {formatDate(document.updatedAt)}
            </Text>
          </View>
        </View>

        {/* Conteúdo do documento */}
        <View style={styles.documentContent}>
          <Text style={styles.contentText}>
            {document.content || 'Este documento está vazio.'}
          </Text>
        </View>

        {/* Barra de ações */}
        <View style={styles.actionBar}>
          {document.userId === user?.id ? (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleEdit}
            >
              <Feather name="edit-2" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Editar</Text>
            </TouchableOpacity>
          ) : (
            <View style={[styles.actionButton, styles.actionButtonDisabled]}>
              <Feather name="eye" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Visualizando</Text>
            </View>
          )}
          
          <TouchableOpacity
            style={[styles.actionButton, styles.shareButton]}
            onPress={handleShare}
          >
            <Feather name="share-2" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Compartilhar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  documentInfo: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  documentTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 14,
    color: '#666',
  },
  metaDot: {
    fontSize: 14,
    color: '#666',
    marginHorizontal: 4,
  },
  documentContent: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    minHeight: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  contentText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2196f3',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 140,
  },
  actionButtonDisabled: {
    backgroundColor: '#78909c',
  },
  shareButton: {
    backgroundColor: '#4caf50',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  headerButtons: {
    flexDirection: 'row',
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#2196f3',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default DocumentViewScreen;
