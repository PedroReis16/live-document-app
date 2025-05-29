const ShareScreen = ({ route }) => {
  // Tela de compartilhamento de documento
  // QR Code do documento
  // Link de compartilhamento
  // Lista de colaboradores atuais
  // Gerenciamento de permissões

  const { documentId } = route.params;
  const [shareCode, setShareCode] = useState("");
  const [qrValue, setQrValue] = useState("");
  const [collaborators, setCollaborators] = useState([]);

  const generateShareCode = async () => {
    // Gerar código único
    // Criar QR code
    // Definir expiração
  };

  const handlePermissionChange = (userId, permission) => {
    // Alterar permissão de colaborador
    // Apenas para owners/admins
  };

  const handleRemoveCollaborator = (userId) => {
    // Remover colaborador
    // Confirmar ação
  };
};
