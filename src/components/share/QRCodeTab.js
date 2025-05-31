import React from "react";
import { View, Text, Alert } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import QRCode from 'react-native-qrcode-svg';
import { styles } from "./styles/QRCodeTab.style";
import Button from "../common/Button";

const QRCodeTab = ({ 
  documentId, 
  loading, 
  shareLinkUrl, 
  currentDocument,
  handleGenerateLink,
  shareLinkExternally 
}) => {
  
  // Copiar link para a área de transferência
  const copyLinkToClipboard = async () => {
    if (!shareLinkUrl) return;

    await Clipboard.setStringAsync(shareLinkUrl);
    Alert.alert("Copiado", "Link copiado para a área de transferência");
  };

  if (!shareLinkUrl) {
    return (
      <View style={styles.noQrCodeContainer}>
        <Text style={styles.noQrCodeText}>
          Gere um link de compartilhamento para criar um QR Code
        </Text>
        <Button
          title="Gerar link compartilhável"
          onPress={handleGenerateLink}
          loading={loading}
          disabled={loading}
          containerStyle={styles.generateButton}
          leftIcon={<Feather name="link" size={20} color="#fff" />}
        />
      </View>
    );
  }

  return (
    <View style={styles.qrContainer}>
      <View style={styles.qrCodeHeaderContainer}>
        <Feather name="camera" size={48} color="#2196f3" />
        <Text style={styles.codeHeader}>QR Code de compartilhamento</Text>
        <Text style={styles.codeSubheader}>
          Escaneie o QR Code abaixo para acessar este documento
        </Text>
      </View>

      <View style={styles.qrCodeWrapper}>
        <QRCode
          value={shareLinkUrl}
          size={200}
          backgroundColor="white"
          color="#000"
        />
      </View>

      <View style={styles.qrCodeActions}>
        <Button
          title="Compartilhar QR Code"
          onPress={shareLinkExternally}
          leftIcon={<Feather name="share-2" size={20} color="#fff" />}
        />
      </View>

      <View style={styles.linkContainer}>
        <Text style={styles.linkTitle}>Link direto:</Text>
        <Text style={styles.linkText} numberOfLines={1}>{shareLinkUrl}</Text>
        <View style={styles.linkActions}>
          <Button
            title="Copiar link"
            onPress={copyLinkToClipboard}
            type="outline"
            leftIcon={<Feather name="copy" size={20} color="#2196f3" />}
            containerStyle={styles.linkButton}
          />
        </View>
      </View>
    </View>
  );
};

export default QRCodeTab;