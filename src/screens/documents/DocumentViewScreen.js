const DocumentViewScreen = ({ route, navigation }) => {
  // Visualização read-only
  // Para documentos compartilhados sem permissão de escrita
  // Ou modo de apresentação

  const { documentId, readOnly } = route.params;

  const handleRequestEditAccess = () => {
    // Solicitar permissão de escrita ao owner
  };
};
