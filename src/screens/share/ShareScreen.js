import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  Share,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { Feather } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { styles } from "./styles/ShareScreen.style";

// Redux actions
import { generateShareCode, fetchCollaborators } from "../../store/shareSlice";

// Componentes
import Button from "../../components/common/Button";
import CollaboratorsList from "../../components/document/CollaboratorsList";

const ShareScreen = ({ route, navigation }) => {
  const { documentId } = route.params || {};
  const dispatch = useDispatch();

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [showCollaborators, setShowCollaborators] = useState(true);

  const { shareCode, shareCodeExpiration, loading, collaborators } =
    useSelector((state) => state.share);
  const { user } = useSelector((state) => state.auth);
  const { currentDocument } = useSelector((state) => state.documents);

  // Carregar colaboradores ao iniciar
  useEffect(() => {
    if (documentId) {
      dispatch(fetchCollaborators(documentId));
    }
  }, [documentId, dispatch]);

  // Atualizar título da tela com nome do documento
  useEffect(() => {
    if (currentDocument) {
      navigation.setOptions({
        title: `Compartilhar: ${currentDocument.title}`,
      });
    }
  }, [currentDocument, navigation]);

  // Gerar código de compartilhamento
  const handleGenerateCode = async () => {
    if (!documentId) {
      Alert.alert("Erro", "ID do documento não encontrado.");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      await dispatch(generateShareCode(documentId)).unwrap();
    } catch (error) {
      console.error("Erro ao gerar código de compartilhamento:", error);
      setError("Não foi possível gerar o código de compartilhamento");

      Alert.alert(
        "Erro",
        "Não foi possível gerar o código de compartilhamento. Tente novamente."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // Formatar data de expiração
  const formatExpirationDate = (dateString) => {
    if (!dateString) return "";

    const date = new Date(dateString);
    return date.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Copiar código para a área de transferência
  const copyCodeToClipboard = async () => {
    if (!shareCode) return;

    await Clipboard.setStringAsync(shareCode);
    Alert.alert("Copiado", "Código copiado para a área de transferência");
  };

  // Compartilhar código via compartilhamento nativo
  const shareCodeExternally = async () => {
    if (!shareCode || !currentDocument) return;

    try {
      const result = await Share.share({
        message: `Entre no meu documento "${
          currentDocument.title
        }" com o código: ${shareCode}. Este código expira em ${formatExpirationDate(
          shareCodeExpiration
        )}.`,
        title: "Compartilhar documento",
      });
    } catch (error) {
      console.error("Erro ao compartilhar:", error);
      Alert.alert("Erro", "Não foi possível compartilhar o código.");
    }
  };

  // Alternar entre códigos e colaboradores
  const toggleView = () => {
    setShowCollaborators(!showCollaborators);
  };

  // Verificar se o usuário é proprietário do documento
  const isOwner = currentDocument && currentDocument.owner === user?.id;

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            showCollaborators && styles.activeTabButton,
          ]}
          onPress={() => setShowCollaborators(true)}
        >
          <Feather
            name="users"
            size={20}
            color={showCollaborators ? "#2196f3" : "#666"}
          />
          <Text
            style={[
              styles.tabButtonText,
              showCollaborators && styles.activeTabButtonText,
            ]}
          >
            Colaboradores
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            !showCollaborators && styles.activeTabButton,
          ]}
          onPress={() => setShowCollaborators(false)}
        >
          <Feather
            name="share-2"
            size={20}
            color={!showCollaborators ? "#2196f3" : "#666"}
          />
          <Text
            style={[
              styles.tabButtonText,
              !showCollaborators && styles.activeTabButtonText,
            ]}
          >
            Código de acesso
          </Text>
        </TouchableOpacity>
      </View>

      {showCollaborators ? (
        <CollaboratorsList documentId={documentId} isOwner={isOwner} />
      ) : (
        <View style={styles.codeContainer}>
          <View style={styles.codeHeaderContainer}>
            <Feather name="link" size={48} color="#2196f3" />
            <Text style={styles.codeHeader}>Código de compartilhamento</Text>
            <Text style={styles.codeSubheader}>
              Compartilhe este código com outras pessoas para permitir acesso ao
              documento
            </Text>
          </View>

          {shareCode ? (
            <View style={styles.codeContentContainer}>
              <View style={styles.codeDisplay}>
                <Text style={styles.codeText}>{shareCode}</Text>
              </View>

              <Text style={styles.expirationText}>
                Expira em: {formatExpirationDate(shareCodeExpiration)}
              </Text>

              <View style={styles.codeActions}>
                <Button
                  title="Copiar código"
                  onPress={copyCodeToClipboard}
                  type="outline"
                  leftIcon={<Feather name="copy" size={20} color="#2196f3" />}
                />

                <Button
                  title="Compartilhar"
                  onPress={shareCodeExternally}
                  leftIcon={<Feather name="share-2" size={20} color="#fff" />}
                />
              </View>

              <Button
                title="Gerar novo código"
                onPress={handleGenerateCode}
                type="text"
                loading={isGenerating}
                disabled={isGenerating}
                containerStyle={styles.newCodeButton}
              />
            </View>
          ) : (
            <View style={styles.noCodeContainer}>
              {loading || isGenerating ? (
                <ActivityIndicator size="large" color="#2196f3" />
              ) : (
                <>
                  <Text style={styles.noCodeText}>
                    Nenhum código de compartilhamento gerado
                  </Text>

                  <Button
                    title="Gerar código"
                    onPress={handleGenerateCode}
                    loading={isGenerating}
                    disabled={isGenerating}
                    containerStyle={styles.generateButton}
                  />
                </>
              )}

              {error && <Text style={styles.errorText}>{error}</Text>}
            </View>
          )}
        </View>
      )}
    </View>
  );
};

export default ShareScreen;
