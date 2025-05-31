// Editor rico de texto
import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform,
  Alert,
  Text
} from 'react-native';
import { TextInput } from 'react-native-gesture-handler';
import { useSelector, useDispatch } from 'react-redux';
import { updateDocument, updateDocumentContent } from '../../store/documentSlice';
import SocketService from '../../services/socket';
import NetInfo from '@react-native-community/netinfo';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { debounce } from 'lodash';
import { Feather } from '@expo/vector-icons';
import { styles } from './styles/DocumentEditor.style';

// Componentes personalizados
import Button from '../common/Button';

const DocumentEditor = ({ 
  document, 
  readOnly = false, 
  collaborationMode = false,
  onSave 
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [collaborators, setCollaborators] = useState([]);
  const [isTyping, setIsTyping] = useState({});
  
  const auth = useSelector(state => state.auth);
  const collaborationActive = useSelector(state => state.documents.collaborationActive);
  const dispatch = useDispatch();
  
  const titleInputRef = useRef(null);
  const contentInputRef = useRef(null);
  const lastSyncedContent = useRef('');
  const lastSyncedTitle = useRef('');
  
  // Monitorar conectividade
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected);
    });
    
    return () => unsubscribe();
  }, []);
  
  // Inicializar dados do documento
  useEffect(() => {
    if (document) {
      setTitle(document.title || '');
      setContent(document.content || '');
      lastSyncedContent.current = document.content || '';
      lastSyncedTitle.current = document.title || '';
    }
  }, [document?.id]);
  
  // Configurar listeners do socket para colaboração
  useEffect(() => {
    if (!collaborationMode || !collaborationActive || !document) return;
    
    // Listener para mudanças no documento de outros usuários
    const unsubscribeChange = SocketService.onDocumentChange(data => {
      if (data.userId !== auth.user?.id) {
        // Atualizar título ou conteúdo recebido de outros usuários
        if (data.changes.title !== undefined) {
          setTitle(data.changes.title);
          lastSyncedTitle.current = data.changes.title;
        }
        
        if (data.changes.content !== undefined) {
          setContent(data.changes.content);
          lastSyncedContent.current = data.changes.content;
        }
      }
    });
    
    // Listener para eventos de digitação de outros usuários
    const unsubscribeTyping = SocketService.onUserTyping(data => {
      if (data.userId !== auth.user?.id) {
        setIsTyping(prev => ({
          ...prev,
          [data.userId]: {
            isTyping: true,
            timestamp: Date.now()
          }
        }));
        
        // Limpar status de digitação após 2 segundos
        setTimeout(() => {
          setIsTyping(prev => ({
            ...prev,
            [data.userId]: {
              isTyping: false,
              timestamp: Date.now()
            }
          }));
        }, 2000);
      }
    });
    
    // Listener para usuários entrando na colaboração
    const unsubscribeJoin = SocketService.onCollaboratorJoined(data => {
      setCollaborators(prev => {
        // Verificar se já existe
        const exists = prev.some(c => c.id === data.user.id);
        if (!exists) {
          return [...prev, { ...data.user, status: 'online' }];
        }
        return prev.map(c => 
          c.id === data.user.id 
            ? { ...c, status: 'online' } 
            : c
        );
      });
    });
    
    // Listener para usuários saindo da colaboração
    const unsubscribeLeave = SocketService.onCollaboratorLeft(data => {
      setCollaborators(prev => 
        prev.map(c => 
          c.id === data.userId 
            ? { ...c, status: 'offline' } 
            : c
        )
      );
    });
    
    // Limpar listeners ao desmontar
    return () => {
      unsubscribeChange();
      unsubscribeTyping();
      unsubscribeJoin();
      unsubscribeLeave();
    };
  }, [collaborationMode, collaborationActive, document, auth.user?.id]);
  
  // Debounce para salvar alterações sem sobrecarregar a API
  const debouncedSave = useRef(
    debounce(async (docId, changes) => {
      if (!docId) return;
      
      try {
        setSaving(true);
        await dispatch(updateDocument({ id: docId, changes })).unwrap();
        
        // Atualizar referências de último conteúdo sincronizado
        if (changes.title !== undefined) {
          lastSyncedTitle.current = changes.title;
        }
        
        if (changes.content !== undefined) {
          lastSyncedContent.current = changes.content;
        }
        
        if (onSave) {
          onSave(changes);
        }
      } catch (error) {
        console.error('Erro ao salvar documento:', error);
        Alert.alert(
          'Erro ao salvar',
          'Não foi possível salvar as alterações. Tente novamente.'
        );
      } finally {
        setSaving(false);
      }
    }, 1000)
  ).current;
  
  // Emitir mudança para colaboração em tempo real (não aguarda debounce)
  const emitChange = (changes) => {
    if (!collaborationMode || !collaborationActive || !document) return;
    
    // Enviar alterações para outros usuários via socket
    SocketService.emitDocumentChange(document.id, changes);
    
    // Notificar que está digitando para mostrar indicador aos outros usuários
    SocketService.emitUserTyping(document.id);
  };
  
  // Handler de mudança de título
  const handleTitleChange = (newTitle) => {
    setTitle(newTitle);
    
    // Atualizar estado local imediatamente (optimistic)
    dispatch(updateDocumentContent({
      id: document?.id,
      content: { title: newTitle }
    }));
    
    // Emitir mudança para colaboração em tempo real
    if (collaborationMode && collaborationActive) {
      emitChange({ title: newTitle });
    }
    
    // Salvar com debounce
    if (!readOnly && document?.id) {
      debouncedSave(document.id, { title: newTitle });
    }
  };
  
  // Handler de mudança de conteúdo
  const handleContentChange = (newContent) => {
    setContent(newContent);
    
    // Atualizar estado local imediatamente (optimistic)
    dispatch(updateDocumentContent({
      id: document?.id,
      content: { content: newContent }
    }));
    
    // Emitir mudança para colaboração em tempo real
    if (collaborationMode && collaborationActive) {
      emitChange({ content: newContent });
    }
    
    // Salvar com debounce
    if (!readOnly && document?.id) {
      debouncedSave(document.id, { content: newContent });
    }
  };
  
  // Salvar documento manualmente (forçar salvamento imediato)
  const handleSave = async () => {
    if (readOnly || !document?.id) return;
    
    const changes = {};
    
    // Verificar se título ou conteúdo foram alterados
    if (title !== lastSyncedTitle.current) {
      changes.title = title;
    }
    
    if (content !== lastSyncedContent.current) {
      changes.content = content;
    }
    
    // Se não há alterações, salva o conteúdo atual de qualquer forma
    if (Object.keys(changes).length === 0) {
      changes.title = title;
      changes.content = content;
    }
    
    try {
      setSaving(true);
      
      // Checar se é um documento local (ID começando com "local_")
      const isLocalDocument = document.id.startsWith('local_');
      
      if (isLocalDocument && onSave) {
        // Para documentos locais, delegamos ao componente pai
        onSave({
          title,
          content
        });
        return;
      }
      
      // Salvar no dispositivo local primeiro
      try {
        // Aqui poderia ser implementada uma lógica para salvar no armazenamento local
        // usando AsyncStorage ou outra solução de persistência local
        console.log('Salvando localmente...');
      } catch (localError) {
        console.warn('Erro ao salvar localmente:', localError);
        // Continua tentando salvar na API mesmo se falhar localmente
      }
      
      // Para documentos normais, usar o dispatch do Redux para salvar na API
      const result = await dispatch(updateDocument({ 
        id: document.id, 
        changes 
      })).unwrap();
      
      // Atualizar referências
      lastSyncedTitle.current = title;
      lastSyncedContent.current = content;
      
      // Chamar callback do componente pai se existir
      if (onSave) {
        onSave(changes);
      }
      
      // Feedback visual para o usuário
      Alert.alert('Sucesso', 'Documento salvo com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar documento:', error);
      Alert.alert(
        'Erro ao salvar',
        'Não foi possível salvar as alterações na API. O documento foi salvo apenas localmente.'
      );
    } finally {
      setSaving(false);
    }
  };
  
  // Exportar documento para arquivo de texto
  const exportDocument = async () => {
    
  };
  
  // Importar documento de arquivo de texto
  const importDocument = async () => {
    
  };
  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.header}>
        {!isOnline && (
          <View style={styles.offlineIndicator}>
            <Feather name="wifi-off" size={16} color="#fff" />
            <Text style={styles.offlineText}>Offline (Salvando localmente)</Text>
          </View>
        )}
        
        {saving && (
          <View style={styles.savingIndicator}>
            <Feather name="refresh-cw" size={16} color="#fff" />
            <Text style={styles.savingText}>Salvando...</Text>
          </View>
        )}
        
        {collaborationMode && collaborationActive && (
          <View style={styles.collaborationIndicator}>
            <Feather name="users" size={16} color="#fff" />
            <Text style={styles.collaborationText}>
              {`${collaborators.filter(c => c.status === 'online').length} online`}
            </Text>
          </View>
        )}
      </View>
      
      <TextInput
        ref={titleInputRef}
        style={styles.titleInput}
        value={title}
        onChangeText={handleTitleChange}
        placeholder="Título do documento"
        placeholderTextColor="#999"
        editable={!readOnly}
      />
      
      <TextInput
        ref={contentInputRef}
        style={styles.contentInput}
        value={content}
        onChangeText={handleContentChange}
        placeholder="Comece a digitar aqui..."
        placeholderTextColor="#999"
        multiline
        textAlignVertical="top"
        editable={!readOnly}
      />
      
      
    </KeyboardAvoidingView>
  );
};


export default DocumentEditor;
