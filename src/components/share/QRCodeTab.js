import React, { useState, useEffect } from "react";
import { View, Text, Alert, TouchableOpacity, ScrollView } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import QRCode from "react-native-qrcode-svg";
import { styles } from "./styles/QRCodeTab.style";
import Button from "../common/Button";

const QRCodeTab = ({
  documentId,
  loading,
  shareLinkUrl,
  currentDocument,
  handleGenerateLink,
  shareLinkExternally,
}) => {
  const [selectedPermission, setSelectedPermission] = useState("read");
  const permissions = [
    { value: "read", label: "Leitura", icon: "eye" },
    { value: "write", label: "Edição", icon: "edit-2" },
    { value: "admin", label: "Administrador", icon: "shield" },
  ];

  // Reset da permissão selecionada quando o link muda ou é removido
  useEffect(() => {
    if (!shareLinkUrl) {
      // Quando não há link, volta para a permissão default
      setSelectedPermission("read");
    }
  }, [shareLinkUrl]);

  // Copiar link para a área de transferência
  const copyLinkToClipboard = async () => {
    if (!shareLinkUrl) return;

    await Clipboard.setStringAsync(shareLinkUrl);
    Alert.alert("Copiado", "Link copiado para a área de transferência");
  };

  // Gerar link com permissão selecionada
  const generateLinkWithPermission = () => {
    handleGenerateLink(selectedPermission);
  };

  // Gerar novo link com permissão diferente
  const generateNewLink = () => {
    handleGenerateLink(selectedPermission);
  };

  if (!shareLinkUrl) {
    return (
      <View style={styles.noQrCodeContainer}>
        <Text style={styles.noQrCodeText}>
          Gere um link de compartilhamento para criar um QR Code
        </Text>

        <View style={styles.permissionsContainer}>
          <Text style={styles.permissionTitle}>
            Selecione a permissão de acesso:
          </Text>
          <View style={styles.permissionOptions}>
            {permissions.map((permission) => (
              <TouchableOpacity
                key={permission.value}
                style={[
                  styles.permissionOption,
                  selectedPermission === permission.value &&
                    styles.selectedPermission,
                ]}
                onPress={() => setSelectedPermission(permission.value)}
              >
                <Feather
                  name={permission.icon}
                  size={20}
                  color={
                    selectedPermission === permission.value ? "#2196f3" : "#666"
                  }
                />
                <Text
                  style={[
                    styles.permissionLabel,
                    selectedPermission === permission.value &&
                      styles.selectedPermissionLabel,
                  ]}
                >
                  {permission.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Button
          title="Gerar link compartilhável"
          onPress={generateLinkWithPermission}
          loading={loading}
          disabled={loading}
          containerStyle={styles.generateButton}
          leftIcon={<Feather name="link" size={20} color="#fff" />}
        />
      </View>
    );
  }

  return (
    <ScrollView>
      <View style={styles.qrContainer}>
        <View style={styles.qrCodeHeaderContainer}>
          <Feather name="camera" size={48} color="#2196f3" />
          <Text style={styles.codeHeader}>QR Code de compartilhamento</Text>
          <Text style={styles.codeSubheader}>
            Escaneie o QR Code abaixo para acessar este documento
          </Text>
        </View>

        <View style={styles.qrCodeWrapper}>
          <QRCode value={shareLinkUrl} size={200} />
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
          <Text style={styles.linkText} numberOfLines={1}>
            {shareLinkUrl}
          </Text>
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

        <View style={styles.newLinkContainer}>
          <Text style={styles.newLinkTitle}>Alterar permissões do link:</Text>

          <View style={styles.permissionOptions}>
            {permissions.map((permission) => (
              <TouchableOpacity
                key={permission.value}
                style={[
                  styles.permissionOption,
                  selectedPermission === permission.value &&
                    styles.selectedPermission,
                ]}
                onPress={() => setSelectedPermission(permission.value)}
              >
                <Feather
                  name={permission.icon}
                  size={18}
                  color={
                    selectedPermission === permission.value ? "#2196f3" : "#666"
                  }
                />
                <Text
                  style={[
                    styles.permissionLabel,
                    selectedPermission === permission.value &&
                      styles.selectedPermissionLabel,
                  ]}
                >
                  {permission.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Button
            title="Gerar novo link"
            onPress={generateNewLink}
            loading={loading}
            disabled={loading}
            type="outline"
            containerStyle={styles.generateNewButton}
            leftIcon={<Feather name="refresh-cw" size={18} color="#2196f3" />}
          />
        </View>
      </View>
    </ScrollView>
  );
};

export default QRCodeTab;
