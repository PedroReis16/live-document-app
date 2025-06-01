import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Alert,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Share, // Importação faltante do componente Share
} from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { Feather } from "@expo/vector-icons";
import { styles } from "./styles/DocumeEditScreen.style";

import {
  fetchDocumentById,
  joinCollaboration,
  leaveCollaboration,
  createDocument,
  clearCollaborationState,
} from "../../store/documentSlice";
import { fetchCollaborators } from "../../store/shareSlice";

import DocumentEditor from "../../components/document/DocumentEditor";
import CollaboratorsList from "../../components/document/CollaboratorsList";
import Button from "../../components/common/Button";

import ShareService from "../../services/share";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { set } from "lodash";

// Chave para salvar documentos no storage local
const LOCAL_DOCUMENT_KEY_PREFIX = "local_document_";

const DocumentEditScreen = ({ route, navigation }) => {
  const { documentId = null, documentData = null } = route.params || {};
  const dispatch = useDispatch();

  const [showCollaborators, setShowCollaborators] = useState(false);
  const [collaborationMode, setCollaborationMode] = useState(false);
  const [creatingServerDoc, setCreatingServerDoc] = useState(false);
  const [isSharedDocument, setIsSharedDocument] = useState(false);
  const [userPermission, setUserPermission] = useState(null);
  const [documentOwner, setDocumentOwner] = useState(null);
  const [isDocumentLoaded, setIsDocumentLoaded] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false); // Estado faltante

  // Adicionar refs para controlar ciclo de vida
  const hasJoinedCollaboration = useRef(false);
  const isScreenMounted = useRef(true);
  const currentDocIdRef = useRef(null);

  const { currentDocument, loading, error, collaborationActive } = useSelector(
    (state) => state.documents
  );
  const { user } = useSelector((state) => state.auth);
  const { collaborators } = useSelector((state) => state.share);

  // Garantir limpeza ao desmontar o componente
  useEffect(() => {
    isScreenMounted.current = true;
    currentDocIdRef.current = documentId;

    // Limpeza ao desmontar
    return () => {
      isScreenMounted.current = false;
      if (collaborationActive && currentDocIdRef.current) {
        dispatch(leaveCollaboration(currentDocIdRef.current));
        ShareService.removeCollaborationListeners();
        dispatch(clearCollaborationState());
      }
      hasJoinedCollaboration.current = false;
    };
  }, []);

  // Carregar o documento quando a tela é montada
  useEffect(() => {
    if (documentId && isScreenMounted.current) {
      if (documentData) {
        // Se temos dados do documento passados como parâmetro
        dispatch({
          type: "documents/setCurrentDocument",
          payload: documentData,
        });

        // Verificar se o documento é compartilhado após ter o documento carregado
        checkDocumentShareStatus(documentId);
      } else {
        // Buscar o documento do servidor
        dispatch(fetchDocumentById(documentId))
          .unwrap()
          .then(() => {
            if (isScreenMounted.current) {
              // Verificar se o documento é compartilhado após ter o documento carregado
              checkDocumentShareStatus(documentId);
            }
          });
      }
    }
  }, [documentId, dispatch]);

  // Verificar se o documento é compartilhado
  const checkDocumentShareStatus = async (docId) => {
    if (!isScreenMounted.current) return;

    try {
      console.log(
        "Verificando status de compartilhamento para o documento:",
        docId
      );
      // Consulta a API de compartilhamento para verificar se o documento tem compartilhamentos
      const response = await ShareService.getShares(docId);

      if (!isScreenMounted.current) return;

      console.log("Compartilhamentos encontrados:", response);

      // Se tiver dados de compartilhamento, então é um documento compartilhado
      const hasShares = response && response.data && response.data.length > 0;
      setIsSharedDocument(hasShares);
      console.log("Documento é compartilhado:", hasShares);

      if (!currentDocument) return;

      console.log("Documento atual:", currentDocument);
      console.log("ID do dono do documento:", currentDocument.ownerId);
      // Buscar informações do owner
      if (currentDocument && currentDocument.ownerId) {
        setDocumentOwner(currentDocument.ownerId);
      }

      // Determinar permissão do usuário
      await determineUserPermission(docId);
      console.log("As permissões do usuário foram definidas:", userPermission);

      if (!isScreenMounted.current) {
        console.log("A tela ainda não esta montada, retornando...");
        return;
      }

      setIsDocumentLoaded(true);

      // Se for compartilhado, buscar colaboradores e ativar modo de colaboração
      if (hasShares) {
        console.log("Documento compartilhado, ativando modo de colaboração");
        setCollaborationMode(true);
        console.log("Buscando colaboradores para o documento:", docId);
        dispatch(fetchCollaborators(docId));
      }
    } catch (error) {
      console.error("Erro ao verificar status de compartilhamento:", error);
      // Se der erro na verificação, assumimos que não é compartilhado
      if (isScreenMounted.current) {
        setIsSharedDocument(false);
        setIsDocumentLoaded(true);
      }
    }
  };

  // Determinar a permissão que o usuário atual tem no documento
  const determineUserPermission = async (docId) => {
    console.log(
      "Determinando as permissões do usuário para o documento:",
      docId
    );
    console.log("O usuário atual é:", user);
    console.log("O id do usuário é: ", user.id);

    if (!currentDocument || !user) {
      setUserPermission("read");
      console.log("O usuário foi definido como leitor por padrão");
      return;
    }

    // Se for owner (comparando ID do dono com ID do usuário atual)
    if (
      currentDocument.ownerId &&
      currentDocument.ownerId === (user.id || user.data._id)
    ) {
      setUserPermission("owner");
      console.log("O usuário é o dono do documento");
      return;
    }

    // Buscar permissão específica deste usuário para este documento
    try {
      var userPermissions = await ShareService.getUserDocumentPermission(
        docId,
        user.id|| user.data._id
      );
      console.log("Permissões do usuário obtidas:", userPermissions);
      if (userPermissions && userPermissions.permission) {
        setUserPermission(userPermissions.permission);
        console.log(
          "Permissão do usuário definida:",
          userPermissions.permission
        );
      } else {
        setUserPermission("read");
        console.log(
          "Permissão do usuário não encontrada, definido como 'read'"
        );
      }
    } catch (error) {
      console.error("Erro ao buscar permissão do usuário:", error);
      setUserPermission("read");
    }
  };

  // Atualizar a barra de navegação com informações do documento
  useEffect(() => {
    if (currentDocument) {
      navigation.setOptions({
        title: currentDocument.title || "Editor de documento",
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
            <TouchableOpacity style={styles.headerButton} onPress={handleShare}>
              <Feather name="share-2" size={24} color="#333" />
            </TouchableOpacity>
          </View>
        ),
      });
    }
  }, [currentDocument, navigation, showCollaborators, isSharedDocument]);

  // Ativar modo de colaboração quando o documento for identificado como compartilhado
  useEffect(() => {
    if (
      isSharedDocument &&
      currentDocument &&
      isDocumentLoaded &&
      isScreenMounted.current
    ) {
      setCollaborationMode(true);
    }
  }, [isSharedDocument, currentDocument, isDocumentLoaded]);

  // Configurar ouvintes de colaboração quando o modo de colaboração estiver ativo
  useEffect(() => {
    if (
      collaborationMode &&
      currentDocument &&
      !collaborationActive &&
      !hasJoinedCollaboration.current
    ) {
      hasJoinedCollaboration.current = true;
      dispatch(joinCollaboration(currentDocument.id));
      dispatch(fetchCollaborators(currentDocument.id));

      ShareService.setupCollaborationListeners(currentDocument.id, {
        onUserJoined: (data) => {
          if (isScreenMounted.current) {
            Alert.alert(
              "Colaboração",
              `${data.user.name || "Um usuário"} entrou no documento`
            );
          }
        },
        onUserLeft: (data) => {
          if (isScreenMounted.current) {
            Alert.alert(
              "Colaboração",
              `${data.user.name || "Um usuário"} saiu do documento`
            );
          }
        },
        onPermissionChanged: (data) => {
          if (isScreenMounted.current) {
            Alert.alert(
              "Permissões",
              `Suas permissões foram alteradas para: ${data.permission}`
            );
          }
        },
      });
    }

    return () => {
      // Cleanup será feito no useEffect que gerencia o ciclo de vida do componente
    };
  }, [collaborationMode, currentDocument, collaborationActive, dispatch]);

  const handleShare = () => {
    if (!currentDocument || !currentDocument.id) {
      Alert.alert("Erro", "Não foi possível compartilhar o documento");
      return;
    }

    // Verificar se o usuário atual é o proprietário do documento
    if (userPermission === "owner") {
      // Se for o dono do documento, navega para a tela de compartilhamento
      navigation.navigate("Share", { documentId: currentDocument.id });
    } else {
      // Se for um documento compartilhado, compartilha um link externo
      Share.share({
        message: `Confira este documento: "${currentDocument.title}"`,
        url: `app://document/${currentDocument.id}`,
      });
    }
  };

  // Salvar backup local do documento (não bloqueante)
  const saveLocalBackup = (docData) => {
    if (!currentDocument?.id) return;

    // Executar de forma não bloqueante
    (async () => {
      try {
        const localData = {
          ...docData,
          localUpdatedAt: new Date().toISOString(),
        };

        await AsyncStorage.setItem(
          `${LOCAL_DOCUMENT_KEY_PREFIX}${currentDocument.id}`,
          JSON.stringify(localData)
        );

        console.log("Backup local salvo com sucesso no EditScreen");
      } catch (error) {
        console.error("Erro ao salvar backup local no EditScreen:", error);
      }
    })();
  };

  const handleSaveDocument = (changes) => {
    try {
      const isLocalDocument = currentDocument?.id?.startsWith("local_");

      if (isLocalDocument) {
        const documentData = {
          title: changes.title || currentDocument.title,
          content: changes.content || currentDocument.content,
        };

        // Salvar localmente de forma não bloqueante
        saveLocalBackup(documentData);

        // Evitar múltiplas tentativas de criação simultâneas
        if (creatingServerDoc) return;

        // Iniciar o processo de criação no servidor em background
        setCreatingServerDoc(true);

        // Tentar salvar no servidor de forma não bloqueante
        (async () => {
          try {
            const createdDoc = await dispatch(
              createDocument(documentData)
            ).unwrap();

            console.log("Documento criado no servidor:", createdDoc.id);

            // Redirecionar para o novo documento sem interromper o usuário
            navigation.replace("DocumentEdit", {
              documentId: createdDoc.id,
            });
          } catch (error) {
            console.error("Erro ao salvar no servidor:", error);
            // Documento continua salvo localmente, usuário pode continuar editando
          } finally {
            setCreatingServerDoc(false);
          }
        })();
      } else {
        // Para documentos normais, o próprio DocumentEditor já cuida do salvamento
        // Não é necessário fazer nada aqui
      }
    } catch (error) {
      console.error("Erro ao salvar documento:", error);
    }
  };

  // Verificar se o usuário pode editar o documento
  const canEdit = () => {
    return (
      userPermission === "owner" ||
      userPermission === "write" ||
      userPermission === "admin"
    );
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
        <Text style={styles.errorText}>Documento não encontrado</Text>
        <Button
          title="Voltar"
          onPress={() => navigation.goBack()}
          style={styles.button}
        />
      </View>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={() => setShowOptionsMenu(false)}>
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
              isOwner={userPermission === "owner"}
            />
          </View>
        ) : (
          <React.Fragment>
            <DocumentEditor
              document={currentDocument}
              readOnly={!canEdit()}
              collaborationMode={collaborationMode}
              onSave={handleSaveDocument}
            />
          </React.Fragment>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
};

export default DocumentEditScreen;
