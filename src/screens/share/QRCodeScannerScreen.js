// filepath: d:\Documentos\Code\Projetos\document-app\src\screens\share\QRCodeScannerScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { BarCodeScanner } from "expo-barcode-scanner";
import { useDispatch } from "react-redux";
import { Feather } from "@expo/vector-icons";
import { styles } from "./styles/QRCodeScannerScreen.style";

// Redux actions
import { processDeepLinkToken } from "../../store/shareSlice";

const QRCodeScannerScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [flashOn, setFlashOn] = useState(false);

  // Solicitar permissão para usar a câmera
  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === "granted");
    })();
  }, []);

  // Manipular o resultado da varredura do QR Code
  const handleBarCodeScanned = async ({ type, data }) => {
    if (scanned) return;
    setScanned(true);

    try {
      // Verificar se o URL é do nosso aplicativo
      if (data.includes("com/share")) {
        // Extrair o token do link
        const token = data.split("/").pop();

        if (token) {
          // Processar o token
          await dispatch(processDeepLinkToken(token)).unwrap();
          navigation.goBack(); // Voltar após processar com sucesso
        } else {
          Alert.alert("Erro", "QR Code inválido ou expirado.");
        }
      } else {
        Alert.alert(
          "Atenção",
          "Este QR Code não é válido para o aplicativo Document. Por favor, verifique o código ou entre em contato com o remetente.",
          [{ text: "OK", onPress: () => setScanned(false) }]
        );
      }
    } catch (error) {
      console.error("Erro ao processar QR Code:", error);
      Alert.alert(
        "Erro",
        "Não foi possível processar este QR Code. Tente novamente.",
        [{ text: "OK", onPress: () => setScanned(false) }]
      );
    }
  };

  // Renderizar com base na permissão
  if (hasPermission === null) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <View style={styles.loadingContainer}>
          <Text style={styles.statusText}>Solicitando acesso à câmera...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <View style={styles.permissionContainer}>
          <Feather name="camera-off" size={48} color="#f44336" />
          <Text style={styles.statusText}>Sem acesso à câmera</Text>
          <Text style={styles.helpText}>
            É necessário permitir o acesso à câmera para escanear QR Codes
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.buttonText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      <BarCodeScanner
        onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.overlay}>
        <View style={styles.scanWindow}>
          <View style={styles.scanCornerTopLeft} />
          <View style={styles.scanCornerTopRight} />
          <View style={styles.scanCornerBottomLeft} />
          <View style={styles.scanCornerBottomRight} />
        </View>

        <View style={styles.footer}>
          {/* <Text style={styles.footerText}>Aponte a câmera para um QR code</Text> */}

          {scanned && (
            <TouchableOpacity
              style={styles.scanAgainButton}
              onPress={() => setScanned(false)}
            >
              <Text style={styles.scanAgainText}>Escanear novamente</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

export default QRCodeScannerScreen;
