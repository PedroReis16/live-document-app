import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Share,
} from "react-native";
import { useSelector } from "react-redux";
import { Feather } from "@expo/vector-icons";
import { styles } from "./styles/DocumentViewScreen.style";

// Serviços
import DocumentService from "../../services/documents";
import { formatDate } from "../../utils/helpers";

const DocumentViewScreen = ({ route, navigation }) => {
  const { documentId } = route.params || {};
  const { user } = useSelector((state) => state.auth);

  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Carregar documento ao montar o componente
  useEffect(() => {
    if (!documentId) {
      setError("ID do documento não fornecido");
      setLoading(false);
      return;
    }

    loadDocument();
  }, [documentId]);

  // Configurar opções de navegação dinâmicas
  useEffect(() => {
    if (document) {
      navigation.setOptions({
        title: document.title || "Visualizar Documento",
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
            <TouchableOpacity style={styles.headerButton} onPress={handleShare}>
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
      console.error("Erro ao carregar documento:", err);
      setError("Não foi possível carregar o documento. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  // Função para editar o documento
  const handleEdit = () => {
    navigation.navigate("DocumentEdit", {
      documentId: document.id,
      isSharedDocument: false,
    });
  };

  // Função para compartilhar o documento
  const handleShare = () => {
    if (document.userId === user?.id) {
      // Se for o dono do documento, navega para a tela de compartilhamento
      navigation.navigate("Share", { documentId: document.id });
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
          <TouchableOpacity style={styles.retryButton} onPress={loadDocument}>
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
              {document.userId === user?.id ? "Você" : document.userName}
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
            {document.content || "Este documento está vazio."}
          </Text>
        </View>

        {/* Barra de ações */}
        <View style={styles.actionBar}>
          {document.userId === user?.id ? (
            <TouchableOpacity style={styles.actionButton} onPress={handleEdit}>
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

export default DocumentViewScreen;
