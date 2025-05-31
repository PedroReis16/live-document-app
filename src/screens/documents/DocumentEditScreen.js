import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Alert,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  Clipboard,
  TouchableWithoutFeedback,
} from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { Feather } from "@expo/vector-icons";
import { styles } from "./styles/DocumeEditScreen.style";

import {
  fetchDocumentById,
  updateDocument,
  joinCollaboration,
  leaveCollaboration,
  createDocument,
} from "../../store/documentSlice";
import { fetchCollaborators } from "../../store/shareSlice";

import DocumentEditor from "../../components/document/DocumentEditor";
import CollaboratorsList from "../../components/document/CollaboratorsList";
import Button from "../../components/common/Button";

import ShareService from "../../services/share";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Chave para salvar documentos no storage local
const LOCAL_DOCUMENT_KEY_PREFIX = "local_document_";

const DocumentEditScreen = ({ route, navigation }) => {
  const { documentId, isNewDocument, isSharedDocument, documentData } =
    route.params || {};
  const dispatch = useDispatch();

  const [showCollaborators, setShowCollaborators] = useState(false);
  const [collaborationMode, setCollaborationMode] = useState(false);
  const [shareCode, setShareCode] = useState(null);
  const [shareError, setShareError] = useState(null);
  const [generatingCode, setGeneratingCode] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [creatingServerDoc, setCreatingServerDoc] = useState(false);

  const optionsMenuRef = useRef(null);

  const { currentDocument, loading, error, collaborationActive } = useSelector(
    (state) => state.documents
  );
  const { user } = useSelector((state) => state.auth);
  const { collaborators } = useSelector((state) => state.share);

  useEffect(() => {
    if (documentId) {
      if (isNewDocument && documentData) {
        dispatch({
          type: "documents/setCurrentDocument",
          payload: route.params.documentData,
        });
      } else {
        dispatch(fetchDocumentById(documentId));
      }
    }
  }, [documentId, dispatch, route.params]);

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

  useEffect(() => {
    if (isSharedDocument && currentDocument) {
      setCollaborationMode(true);
    }
  }, [isSharedDocument, currentDocument]);

  useEffect(() => {
    if (collaborationMode && currentDocument && !collaborationActive) {
      dispatch(joinCollaboration(currentDocument.id));
      dispatch(fetchCollaborators(currentDocument.id));

      ShareService.setupCollaborationListeners(currentDocument.id, {
        onUserJoined: (data) => {
          Alert.alert("Colaboração", `${data.user.name} entrou no documento`);
        },
        onUserLeft: (data) => {
          Alert.alert("Colaboração", `${data.user.name} saiu do documento`);
        },
        onPermissionChanged: (data) => {
          Alert.alert(
            "Permissões",
            `Suas permissões foram alteradas para: ${data.permission}`
          );
        },
      });
    }

    return () => {
      if (collaborationMode && currentDocument && collaborationActive) {
        dispatch(leaveCollaboration(currentDocument.id));
        ShareService.removeCollaborationListeners();
      }
    };
  }, [collaborationMode, currentDocument, collaborationActive, dispatch]);

  const handleShare = async () => {
    if (!currentDocument) return;

    try {
      setGeneratingCode(true);
      setShareError(null);

      let code = ShareService.getShareCodeForDocument(currentDocument.id);

      if (!code) {
        const response = await ShareService.generateShareCode(
          currentDocument.id
        );
        code = response.shareCode;
      }

      setShareCode(code);

      Alert.alert(
        "Compartilhar documento",
        `Compartilhe este código com outras pessoas:\n\n${code}\n\nEste código expira em 24 horas.`,
        [
          { text: "Copiar código", onPress: () => copyToClipboard(code) },
          { text: "OK", style: "default" },
        ]
      );
    } catch (error) {
      console.error("Erro ao gerar código de compartilhamento:", error);
      setShareError("Não foi possível gerar o código de compartilhamento");

      Alert.alert(
        "Erro",
        "Não foi possível gerar o código de compartilhamento. Tente novamente."
      );
    } finally {
      setGeneratingCode(false);
    }
  };

  const copyToClipboard = (text) => {
    Clipboard.setString(text);
    Alert.alert("Copiado", "Código copiado para a área de transferência");
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
              isSharedDocument: false,
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

  const getUserPermission = () => {
    if (!currentDocument || !user) return null;

    if (currentDocument.owner === user.id) {
      return "owner";
    }

    const collaborator = collaborators.find((c) => c.id === user.id);
    return collaborator?.permission || "read";
  };

  const canEdit = () => {
    const permission = getUserPermission();
    return permission === "owner" || permission === "write";
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
              isOwner={currentDocument.owner === user?.id}
            />
          </View>
        ) : (
          <React.Fragment>
            <DocumentEditor
              document={currentDocument}
              readOnly={isSharedDocument && !canEdit()}
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
