import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Alert, ActivityIndicator, Text, TouchableOpacity, Clipboard } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Feather } from '@expo/vector-icons';

// Redux actions
import { 
  fetchDocumentById, 
  updateDocument, 
  joinCollaboration, 
  leaveCollaboration,
  createDocument
} from '../../store/documentSlice';
import { fetchCollaborators } from '../../store/shareSlice';

// Componentes
import DocumentEditor from '../../components/document/DocumentEditor';
import CollaboratorsList from '../../components/document/CollaboratorsList';
import Button from '../../components/common/Button';

// Serviços
import SocketService from '../../services/socket';
import ShareService from '../../services/share';

const DocumentEditScreen = ({ route, navigation }) => {
  const { documentId, isSharedDocument } = route.params || {};
  const dispatch = useDispatch();
  
  // States do componente
  const [showCollaborators, setShowCollaborators] = useState(false);
  const [collaborationMode, setCollaborationMode] = useState(false);
  const [shareCode, setShareCode] = useState(null);
  const [shareError, setShareError] = useState(null);
  const [generatingCode, setGeneratingCode] = useState(false);
  
  // States do Redux
  const { currentDocument, loading, error, collaborationActive } = useSelector(
    state => state.documents
  );
  const { user } = useSelector(state => state.auth);
  const { collaborators } = useSelector(state => state.share);
  
  // Carregar documento
  useEffect(() => {
    if (documentId) {
      // Verificar se é um documento local passado via params
      if (route.params?.isNewDocument && route.params?.documentData) {
        // Usar diretamente os dados do documento local
        dispatch({
          type: 'documents/setCurrentDocument',
          payload: route.params.documentData
        });
      } else {
        // Buscar do servidor
        dispatch(fetchDocumentById(documentId));
      }
    }
  }, [documentId, dispatch, route.params]);
  
  // Definir título da tela
  useEffect(() => {
    if (currentDocument) {
      navigation.setOptions({
        title: currentDocument.title || 'Editor de documento',
        headerRight: () => (
          <View style={styles.headerButtons}>
            {isSharedDocument && (
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => setShowCollaborators(!showCollaborators)}
              >
                <Feather name="users" size={24} color="#333" />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleShare}
            >
              <Feather name="share-2" size={24} color="#333" />
            </TouchableOpacity>
          </View>
        )
      });
    }
  }, [currentDocument, navigation, showCollaborators, isSharedDocument]);
  
  // Ativar modo de colaboração quando solicitado
  useEffect(() => {
    if (isSharedDocument && currentDocument) {
      setCollaborationMode(true);
    }
  }, [isSharedDocument, currentDocument]);
  
  // Entrar no modo de colaboração (conectar ao socket)
  useEffect(() => {
    if (collaborationMode && currentDocument && !collaborationActive) {
      dispatch(joinCollaboration(currentDocument.id));
      dispatch(fetchCollaborators(currentDocument.id));
      
      // Configurar listeners para eventos de colaboração
      ShareService.setupCollaborationListeners(currentDocument.id, {
        onUserJoined: (data) => {
          Alert.alert('Colaboração', `${data.user.name} entrou no documento`);
        },
        onUserLeft: (data) => {
          // Opcional: mostrar notificação quando alguém sair
        },
        onPermissionChanged: (data) => {
          Alert.alert('Permissões', 
            `Suas permissões foram alteradas para: ${data.permission}`
          );
        }
      });
    }
    
    // Cleanup ao sair do documento
    return () => {
      if (collaborationMode && currentDocument && collaborationActive) {
        dispatch(leaveCollaboration(currentDocument.id));
        ShareService.removeCollaborationListeners();
      }
    };
  }, [collaborationMode, currentDocument, collaborationActive, dispatch]);
  
  // Gerar código de compartilhamento
  const handleShare = async () => {
    if (!currentDocument) return;
    
    try {
      setGeneratingCode(true);
      setShareError(null);
      
      // Verificar se já existe um código válido em cache
      let code = ShareService.getShareCodeForDocument(currentDocument.id);
      
      if (!code) {
        // Gerar novo código
        const response = await ShareService.generateShareCode(currentDocument.id);
        code = response.shareCode;
      }
      
      setShareCode(code);
      
      // Mostrar modal ou alert com o código
      Alert.alert(
        'Compartilhar documento',
        `Compartilhe este código com outras pessoas:\n\n${code}\n\nEste código expira em 24 horas.`,
        [
          { text: 'Copiar código', onPress: () => copyToClipboard(code) },
          { text: 'OK', style: 'default' }
        ]
      );
      
    } catch (error) {
      console.error('Erro ao gerar código de compartilhamento:', error);
      setShareError('Não foi possível gerar o código de compartilhamento');
      
      Alert.alert(
        'Erro',
        'Não foi possível gerar o código de compartilhamento. Tente novamente.'
      );
    } finally {
      setGeneratingCode(false);
    }
  };
  
  // Copiar código para clipboard
  const copyToClipboard = (text) => {
    Clipboard.setString(text);
    Alert.alert('Copiado', 'Código copiado para a área de transferência');
  };
  
  // Salvar documento
  const handleSaveDocument = async (changes) => {
    try {
      // Verificar se é um documento local (ID começando com "local_")
      const isLocalDocument = currentDocument?.id?.startsWith('local_');
      
      if (isLocalDocument) {
        // Para documentos locais, precisamos criar um novo documento no servidor
        const documentData = {
          title: changes.title || currentDocument.title,
          content: changes.content || currentDocument.content,
          // Outros campos necessários
        };
        
        const createdDoc = await dispatch(createDocument(documentData)).unwrap();
        
        // Feedback visual para o usuário
        Alert.alert('Sucesso', 'Documento salvo com sucesso no servidor!');
        
        // Navegar de volta para a tela anterior ou atualizar o ID do documento atual
        navigation.replace('DocumentEdit', {
          documentId: createdDoc.id,
          isSharedDocument: false
        });
      } else {
        // Para documentos existentes no servidor
        await dispatch(updateDocument({ 
          id: currentDocument.id, 
          changes 
        })).unwrap();
        
        // Feedback visual para o usuário
        Alert.alert('Sucesso', 'Alterações salvas com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao salvar documento:', error);
      Alert.alert(
        'Erro',
        'Não foi possível salvar as alterações. Tente novamente.'
      );
    }
  };
  
  // Verificar permissões do usuário no documento compartilhado
  const getUserPermission = () => {
    if (!currentDocument || !user) return null;
    
    // Se o usuário é o dono do documento
    if (currentDocument.owner === user.id) {
      return 'owner';
    }
    
    // Procurar permissões nos colaboradores
    const collaborator = collaborators.find(c => c.id === user.id);
    return collaborator?.permission || 'read';
  };
  
  // Determinar se o usuário tem permissão de escrita
  const canEdit = () => {
    const permission = getUserPermission();
    return permission === 'owner' || permission === 'write';
  };
  
  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Carregando documento...</Text>
      </View>
    );
  }
  
  if (error) {
    return (
      <View style={styles.centeredContainer}>
        <Feather name="alert-triangle" size={48} color="#ff0000" />
        <Text style={styles.errorText}>
          Erro ao carregar documento: {error}
        </Text>
        <Button 
          title="Voltar" 
          onPress={() => navigation.goBack()}
          style={styles.button}
        />
      </View>
    );
  }
  
  if (!currentDocument) {
    return (
      <View style={styles.centeredContainer}>
        <Feather name="file-minus" size={48} color="#666" />
        <Text style={styles.errorText}>
          Documento não encontrado
        </Text>
        <Button 
          title="Voltar" 
          onPress={() => navigation.goBack()}
          style={styles.button}
        />
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      {showCollaborators ? (
        <View style={styles.collaboratorsContainer}>
          <View style={styles.collaboratorsHeader}>
            <Text style={styles.collaboratorsTitle}>Colaboradores</Text>
            <TouchableOpacity onPress={() => setShowCollaborators(false)}>
              <Feather name="x" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          <CollaboratorsList
            key={currentDocument.id} 
            documentId={currentDocument.id}
            isOwner={currentDocument.owner === user?.id}
          />
        </View>
      ) : (
        <DocumentEditor
          document={currentDocument}
          readOnly={isSharedDocument && !canEdit()}
          collaborationMode={collaborationMode}
          onSave={handleSaveDocument}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666'
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    color: '#ff0000',
    textAlign: 'center',
    marginBottom: 20
  },
  button: {
    minWidth: 150
  },
  headerButtons: {
    flexDirection: 'row',
    marginRight: 10
  },
  headerButton: {
    marginHorizontal: 8
  },
  collaboratorsContainer: {
    flex: 1,
    backgroundColor: '#fff'
  },
  collaboratorsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  collaboratorsTitle: {
    fontSize: 18,
    fontWeight: 'bold'
  }
});

export default DocumentEditScreen;
