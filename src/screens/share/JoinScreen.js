const JoinScreen = ({ navigation }) => {
  // Tela para entrar em documento compartilhado
  // Scanner de QR code
  // Input manual de código
  // Visualização de preview do documento

  const [scanned, setScanned] = useState(false);
  const [manualCode, setManualCode] = useState("");

  const handleQRCodeScanned = ({ data }) => {
    // Processar código escaneado
    // Validar formato
    // Tentar entrar no documento
  };

  const handleManualJoin = async () => {
    // Validar código manual
    // Chamar API de join
    // Navegar para documento
  };
};
