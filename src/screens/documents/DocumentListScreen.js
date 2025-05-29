const DocumentListScreen = ({ navigation }) => {
  // Lista de documentos do usuário
  // Documentos compartilhados
  // Estado de sincronização
  // Busca e filtros
  // Pull-to-refresh

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadDocuments = async () => {
    // Carregar documentos locais (AsyncStorage)
    // Sincronizar com API
    // Mesclar dados local + remoto
  };

  const handleCreateDocument = () => {
    // Navegar para tela de criação
  };

  const handleDocumentPress = (document) => {
    // Navegar para edição/visualização
  };

  const handleShareDocument = (document) => {
    // Abrir modal de compartilhamento
  };
};
