import React, { useEffect, useState, useRef } from "react";
import {
  View,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  Clipboard,
  TouchableWithoutFeedback,
} from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { Feather } from "@expo/vector-icons";

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

import SocketService from "../../services/socket";
import ShareService from "../../services/share";

const DocumentEditScreen = ({ route, navigation }) => {
  const { documentId, isSharedDocument } = route.params || {};
  const dispatch = useDispatch();

  const [showCollaborators, setShowCollaborators] = useState(false);
  const [collaborationMode, setCollaborationMode] = useState(false);
  const [shareCode, setShareCode] = useState(null);
  const [shareError, setShareError] = useState(null);
  const [generatingCode, setGeneratingCode] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);

  const optionsMenuRef = useRef(null);

  const { currentDocument, loading, error, collaborationActive } = useSelector(
    (state) => state.documents
  );
  const { user } = useSelector((state) => state.auth);
  const { collaborators } = useSelector((state) => state.share);

  useEffect(() => {
    if (documentId) {
      if (route.params?.isNewDocument && route.params?.documentData) {
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

  const handleSaveDocument = async (changes) => {
    try {
      const isLocalDocument = currentDocument?.id?.startsWith("local_");

      if (isLocalDocument) {
        const documentData = {
          title: changes.title || currentDocument.title,
          content: changes.content || currentDocument.content,
        };

        const createdDoc = await dispatch(
          createDocument(documentData)
        ).unwrap();

        Alert.alert("Sucesso", "Documento salvo com sucesso no servidor!");

        navigation.replace("DocumentEdit", {
          documentId: createdDoc.id,
          isSharedDocument: false,
        });
      } else {
        await dispatch(
          updateDocument({
            id: currentDocument.id,
            changes,
          })
        ).unwrap();

        Alert.alert("Sucesso", "Alterações salvas com sucesso!");
      }
    } catch (error) {
      console.error("Erro ao salvar documento:", error);
      Alert.alert(
        "Erro",
        "Não foi possível salvar as alterações. Tente novamente."
      );
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

            {canEdit() && (
              <TouchableOpacity
                style={styles.saveButton}
                onPress={() =>
                  handleSaveDocument({
                    title: currentDocument.title,
                    content: currentDocument.content,
                  })
                }
              >
                <Feather name="save" size={24} color="#fff" />
              </TouchableOpacity>
            )}
          </React.Fragment>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    color: "#ff0000",
    textAlign: "center",
    marginBottom: 20,
  },
  button: {
    minWidth: 150,
  },
  headerButtons: {
    flexDirection: "row",
    marginRight: 10,
  },
  headerButton: {
    marginHorizontal: 8,
  },
  collaboratorsContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  collaboratorsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  collaboratorsTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  saveButton: {
    position: "absolute",
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#007bff",
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  optionsArea: {
    position: "absolute",
    top: 20,
    right: 20,
    zIndex: 1000,
  },
  optionsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  optionsMenu: {
    position: "absolute",
    top: 45,
    right: 0,
    width: 150,
    backgroundColor: "#fff",
    borderRadius: 8,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  optionIcon: {
    marginRight: 10,
  },
  optionText: {
    fontSize: 16,
    color: "#333",
  },
});

export default DocumentEditScreen;
