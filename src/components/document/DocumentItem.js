import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { styles } from "./styles/DocumentItem.style";

// Item da lista de documentos
const DocumentItem = ({ document, onLongPress, onDelete, onShare }) => {
  const navigation = useNavigation();

  // Formatar data para exibição
  const formatDate = (dateString) => {
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

  // Abrir documento para visualização
  const handlePress = () => {
    navigation.navigate("DocumentView", {
      documentId: document.id,
      isSharedDocument: document.shared || false,
    });
  };

  // Abrir menu de compartilhamento
  const handleShare = () => {
    if (typeof onShare === "function") {
      onShare(document);
    } else {
      // Navegar diretamente para a tela de compartilhamento se não houver handler
      navigation.navigate("Share", { documentId: document.id });
    }
  };

  // Deletar documento
  const handleDelete = () => {
    if (typeof onDelete === "function") {
      onDelete(document);
    }
  };

  return (
    <TouchableOpacity
      key={document.id}
      style={styles.container}
      onPress={handlePress}
      onLongPress={() => onLongPress && onLongPress(document)}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <Feather
          name={document.shared ? "file-plus" : "file-text"}
          size={24}
          color={document.shared ? "#2196f3" : "#666"}
        />
      </View>

      <View style={styles.contentContainer}>
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {document.title || "Documento sem título"}
          </Text>

          {document.shared && (
            <View style={styles.badge}>
              <Feather name="users" size={12} color="#fff" />
            </View>
          )}

          {document.syncStatus === "pending" && (
            <View style={[styles.badge, styles.pendingBadge]}>
              <Feather name="clock" size={12} color="#fff" />
            </View>
          )}
        </View>

        <Text style={styles.date} numberOfLines={1}>
          {document.createdAt
            ? `Criado em: ${formatDate(document.createdAt)}`
            : "Data desconhecida"}
        </Text>

        <Text style={styles.date} numberOfLines={1}>
          {document.updatedAt
            ? `Última edição: ${formatDate(document.updatedAt)}`
            : ""}
        </Text>

        {document.collaborators && document.collaborators.length > 0 && (
          <View style={styles.collaboratorsContainer}>
            <Feather name="users" size={14} color="#666" />
            <Text style={styles.collaboratorsText}>
              {document.collaborators.length} colaborador
              {document.collaborators.length > 1 ? "es" : ""}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.actionsContainer}>
        <TouchableOpacity
          key={`share-${document.id}`} // Add unique key
          style={styles.actionButton}
          onPress={handleShare}
        >
          <Feather name="share-2" size={20} color="#2196f3" />
        </TouchableOpacity>

        {!document.shared && (
          <TouchableOpacity
            key={`delete-${document.id}`} // Add unique key
            style={styles.actionButton}
            onPress={handleDelete}
          >
            <Feather name="trash-2" size={20} color="#f44336" />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default DocumentItem;
