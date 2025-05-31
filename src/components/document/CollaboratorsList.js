import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { Feather } from "@expo/vector-icons";

// Redux actions
import {
  fetchCollaborators,
  updatePermission,
  removeCollaborator,
} from "../../store/shareSlice";

// Serviços
import ShareService from "../../services/share";

// Lista de colaboradores ativos
const CollaboratorsList = ({ documentId, isOwner = false }) => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const { user } = useSelector((state) => state.auth);
  const { collaborators, loading: storeLoading } = useSelector(
    (state) => state.share
  );

  // Carregar colaboradores ao iniciar
  useEffect(() => {
    loadCollaborators();
  }, [documentId]);

  // Função para carregar colaboradores
  const loadCollaborators = async () => {
    if (!documentId) return;

    try {
      setLoading(true);
      setError(null);
      await dispatch(fetchCollaborators(documentId)).unwrap();
    } catch (error) {
      console.error("Erro ao carregar colaboradores:", error);
      setError("Não foi possível carregar a lista de colaboradores");

      Alert.alert(
        "Erro",
        "Não foi possível carregar a lista de colaboradores. Tente novamente."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Função para atualizar ao puxar para baixo (pull to refresh)
  const handleRefresh = () => {
    setRefreshing(true);
    loadCollaborators();
  };

  // Mudar permissão de um colaborador
  const handleChangePermission = (userId, currentPermission) => {
    if (!isOwner) return;

    // Opções de permissão
    const permissions = [
      { label: "Leitura", value: "read" },
      { label: "Escrita", value: "write" },
    ];

    // Criar itens do ActionSheet
    const options = permissions.map((p) => p.label);
    options.push("Cancelar");

    // Mostrar ActionSheet
    Alert.alert("Alterar permissão", "Selecione o tipo de acesso:", [
      ...permissions.map((p) => ({
        text: p.label,
        onPress: () => updateCollaboratorPermission(userId, p.value),
      })),
      {
        text: "Cancelar",
        style: "cancel",
      },
    ]);
  };

  // Atualizar permissão no servidor
  const updateCollaboratorPermission = async (userId, permission) => {
    if (!documentId || !userId) return;

    try {
      setLoading(true);
      await dispatch(
        updatePermission({
          documentId,
          userId,
          permission,
        })
      ).unwrap();

      Alert.alert("Sucesso", "Permissão atualizada com sucesso");
    } catch (error) {
      console.error("Erro ao atualizar permissão:", error);
      Alert.alert(
        "Erro",
        "Não foi possível atualizar a permissão. Tente novamente."
      );
    } finally {
      setLoading(false);
    }
  };

  // Remover colaborador
  const handleRemoveCollaborator = (userId, userName) => {
    if (!isOwner) return;

    Alert.alert(
      "Remover colaborador",
      `Tem certeza que deseja remover ${userName} da lista de colaboradores?`,
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Remover",
          onPress: () => removeUserCollaboration(userId),
          style: "destructive",
        },
      ]
    );
  };

  // Remover colaborador no servidor
  const removeUserCollaboration = async (userId) => {
    if (!documentId || !userId) return;

    try {
      setLoading(true);
      await dispatch(
        removeCollaborator({
          documentId,
          userId,
        })
      ).unwrap();

      Alert.alert("Sucesso", "Colaborador removido com sucesso");
    } catch (error) {
      console.error("Erro ao remover colaborador:", error);
      Alert.alert(
        "Erro",
        "Não foi possível remover o colaborador. Tente novamente."
      );
    } finally {
      setLoading(false);
    }
  };

  // Renderizar item da lista de colaboradores
  const renderCollaboratorItem = ({ item }) => {
    const isCurrentUser = item.id === user?.id;
    const isDocumentOwner = item.role === "owner";
    const canManage = isOwner && !isDocumentOwner && !isCurrentUser;

    return (
      <View style={styles.collaboratorItem}>
        <View style={styles.collaboratorInfo}>
          <View style={styles.nameContainer}>
            <Text style={styles.collaboratorName}>
              {item.name} {isCurrentUser && "(Você)"}
            </Text>
            {isDocumentOwner && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Proprietário</Text>
              </View>
            )}
          </View>

          <Text style={styles.collaboratorEmail}>{item.email}</Text>

          <View style={styles.permissionContainer}>
            <Text style={styles.permissionLabel}>Acesso: </Text>
            <Text style={styles.permissionValue}>
              {item.permission === "write" ? "Escrita" : "Leitura"}
            </Text>
          </View>

          <View style={styles.statusContainer}>
            <View
              style={[
                styles.statusIndicator,
                {
                  backgroundColor:
                    item.status === "online" ? "#4caf50" : "#9e9e9e",
                },
              ]}
            />
            <Text style={styles.statusText}>
              {item.status === "online" ? "Online" : "Offline"}
            </Text>
          </View>
        </View>

        {canManage && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleChangePermission(item.id, item.permission)}
            >
              <Feather name="edit-2" size={20} color="#2196f3" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleRemoveCollaborator(item.id, item.name)}
            >
              <Feather name="trash-2" size={20} color="#f44336" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  // Renderizar lista vazia
  const renderEmptyList = () => {
    if (loading || storeLoading) return null;

    return (
      <View style={styles.emptyContainer}>
        <Feather name="users" size={48} color="#9e9e9e" />
        <Text style={styles.emptyText}>Nenhum colaborador encontrado</Text>
        {isOwner && (
          <Text style={styles.emptySubtext}>
            Compartilhe o código do documento para adicionar colaboradores
          </Text>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text style={styles.loadingText}>Carregando colaboradores...</Text>
        </View>
      ) : (
        <FlatList
          key={item.id}
          data={collaborators}
          keyExtractor={(item) => item.id}
          renderItem={renderCollaboratorItem}
          ListEmptyComponent={renderEmptyList}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          contentContainerStyle={
            collaborators.length === 0 ? { flex: 1 } : styles.listContent
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  listContent: {
    padding: 16,
  },
  collaboratorItem: {
    flexDirection: "row",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    alignItems: "center",
    justifyContent: "space-between",
  },
  collaboratorInfo: {
    flex: 1,
  },
  nameContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  collaboratorName: {
    fontSize: 16,
    fontWeight: "bold",
    marginRight: 8,
  },
  collaboratorEmail: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  permissionContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  permissionLabel: {
    fontSize: 14,
    color: "#666",
  },
  permissionValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: "#666",
  },
  badge: {
    backgroundColor: "#2196f3",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButton: {
    padding: 8,
    marginHorizontal: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: "#666",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    marginTop: 8,
    textAlign: "center",
  },
});

export default CollaboratorsList;
