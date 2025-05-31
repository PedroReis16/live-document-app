import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  Share,
  ScrollView,
  Linking
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { Feather } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { styles } from "./styles/ShareScreen.style";
import QRCode from 'react-native-qrcode-svg';

// Redux actions
import { generateShareLink, shareWithUser } from "../../store/shareSlice";

// Componentes
import Button from "../../components/common/Button";
import CollaboratorsList from "../../components/document/CollaboratorsList";
import Input from "../../components/common/Input";

const ShareScreen = ({ route, navigation }) => {
  const { documentId } = route.params || {};
  const dispatch = useDispatch();

  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState("read");
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);

  const { 
    loading,
    shareLink,
    shareLinkUrl,
    error,
  } = useSelector((state) => state.share);
  
  const { user } = useSelector((state) => state.auth);
  const { currentDocument } = useSelector((state) => state.documents);
  
  const [activeTab, setActiveTab] = useState("collaborators");

  // Atualizar título da tela com nome do documento
  useEffect(() => {
    if (currentDocument) {
      navigation.setOptions({
        title: `Compartilhar: ${currentDocument.title || "Documento"}`,
      });
    }
  }, [currentDocument, navigation]);

  // Gerar link compartilhável e QR Code
  const handleGenerateLink = async () => {
    if (!documentId) {
      Alert.alert("Erro", "ID do documento não encontrado.");
      return;
    }

    try {
      await dispatch(generateShareLink({ 
        documentId,
        options: { permission: 'read', expiresIn: '7d' }
      })).unwrap();
      
      setShowQRCode(true);
    } catch (error) {
      console.error("Erro ao gerar link de compartilhamento:", error);
      Alert.alert(
        "Erro",
        "Não foi possível gerar o link de compartilhamento. Tente novamente."
      );
    }
  };

  // Compartilhar com usuário por email
  const handleShareWithUser = async () => {
    if (!email || !documentId) return;

    try {
      await dispatch(shareWithUser({
        documentId,
        email,
        permission
      })).unwrap();
      
      Alert.alert(
        "Sucesso",
        "Documento compartilhado com sucesso!",
        [
          { text: "OK", onPress: () => setShowEmailInput(false) }
        ]
      );
      
      setEmail("");
    } catch (error) {
      Alert.alert(
        "Erro",
        error.message || "Não foi possível compartilhar o documento. Verifique o email e tente novamente."
      );
    }
  };
  
  // Copiar link para a área de transferência
  const copyLinkToClipboard = async () => {
    if (!shareLinkUrl) return;

    await Clipboard.setStringAsync(shareLinkUrl);
    Alert.alert("Copiado", "Link copiado para a área de transferência");
  };

  // Compartilhar link via compartilhamento nativo
  const shareLinkExternally = async () => {
    if (!shareLinkUrl || !currentDocument) return;

    try {
      const result = await Share.share({
        message: `Acesse meu documento "${currentDocument.title || "Documento"}" através deste link: ${shareLinkUrl}`,
        url: shareLinkUrl,
        title: "Compartilhar documento",
      });
    } catch (error) {
      console.error("Erro ao compartilhar:", error);
      Alert.alert("Erro", "Não foi possível compartilhar o link.");
    }
  };

  // Abrir tela do scanner QR Code
  const handleOpenScanner = () => {
    navigation.navigate('QRCodeScannerScreen');
  };

  // Renderizar seção de link e QRCode
  const renderQRCodeSection = () => {
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

  const renderEmailForm = () => {
    if (!showEmailInput) {
      return (
        <View style={styles.addCollaboratorContainer}>
          <Text style={styles.sectionHeader}>Compartilhar por e-mail</Text>
          <Button
            title="Adicionar colaborador"
            onPress={() => setShowEmailInput(true)}
            type="outline"
            leftIcon={<Feather name="user-plus" size={20} color="#2196f3" />}
          />
        </View>
      );
    }

    return (
      <View style={styles.emailFormContainer}>
        <Text style={styles.sectionHeader}>Compartilhar por e-mail</Text>
        
        <Input
          placeholder="email@exemplo.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          leftIcon="mail"
        />
        
        <View style={styles.permissionSelector}>
          <Text style={styles.permissionLabel}>Permissão:</Text>
          <View style={styles.permissionOptions}>
            <TouchableOpacity
              style={[
                styles.permissionOption,
                permission === "read" && styles.permissionOptionActive,
              ]}
              onPress={() => setPermission("read")}
            >
              <Text
                style={[
                  styles.permissionText,
                  permission === "read" && styles.permissionTextActive,
                ]}
              >
                Leitura
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.permissionOption,
                permission === "write" && styles.permissionOptionActive,
              ]}
              onPress={() => setPermission("write")}
            >
              <Text
                style={[
                  styles.permissionText,
                  permission === "write" && styles.permissionTextActive,
                ]}
              >
                Edição
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.permissionOption,
                permission === "admin" && styles.permissionOptionActive,
              ]}
              onPress={() => setPermission("admin")}
            >
              <Text
                style={[
                  styles.permissionText,
                  permission === "admin" && styles.permissionTextActive,
                ]}
              >
                Admin
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.emailFormActions}>
          <Button
            title="Cancelar"
            onPress={() => {
              setShowEmailInput(false);
              setEmail("");
            }}
            type="text"
            containerStyle={styles.cancelButton}
          />
          <Button
            title="Compartilhar"
            onPress={handleShareWithUser}
            loading={loading}
            disabled={!email || loading}
          />
        </View>
      </View>
    );
  };

  // Conteúdo baseado na aba selecionada
  const renderContent = () => {
    switch (activeTab) {
      case 'collaborators':
        return <CollaboratorsList documentId={documentId} />;
      case 'email':
        return renderEmailForm();
      case 'qrcode':
        return renderQRCodeSection();
      case 'scan':
        return (
          <View style={styles.scanContainer}>
            <Text style={styles.scanTitle}>Escanear QR Code</Text>
            <Text style={styles.scanSubtitle}>
              Use o scanner para acessar documentos compartilhados via QR Code
            </Text>
            <Button
              title="Abrir scanner"
              onPress={handleOpenScanner}
              leftIcon={<Feather name="camera" size={20} color="#fff" />}
              containerStyle={styles.scanButton}
            />
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.tabsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === 'collaborators' && styles.activeTab
              ]}
              onPress={() => setActiveTab('collaborators')}
            >
              <Feather 
                name="users" 
                size={20} 
                color={activeTab === 'collaborators' ? "#2196f3" : "#666"} 
              />
              <Text 
                style={[
                  styles.tabText,
                  activeTab === 'collaborators' && styles.activeTabText
                ]}
              >
                Colaboradores
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === 'email' && styles.activeTab
              ]}
              onPress={() => setActiveTab('email')}
            >
              <Feather 
                name="mail" 
                size={20} 
                color={activeTab === 'email' ? "#2196f3" : "#666"} 
              />
              <Text 
                style={[
                  styles.tabText,
                  activeTab === 'email' && styles.activeTabText
                ]}
              >
                Email
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === 'qrcode' && styles.activeTab
              ]}
              onPress={() => setActiveTab('qrcode')}
            >
              <Feather 
                name="share-2" 
                size={20} 
                color={activeTab === 'qrcode' ? "#2196f3" : "#666"} 
              />
              <Text 
                style={[
                  styles.tabText,
                  activeTab === 'qrcode' && styles.activeTabText
                ]}
              >
                QR Code
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === 'scan' && styles.activeTab
              ]}
              onPress={() => setActiveTab('scan')}
            >
              <Feather 
                name="camera" 
                size={20} 
                color={activeTab === 'scan' ? "#2196f3" : "#666"} 
              />
              <Text 
                style={[
                  styles.tabText,
                  activeTab === 'scan' && styles.activeTabText
                ]}
              >
                Escanear
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        <View style={styles.contentContainer}>
          {renderContent()}
        </View>
      </ScrollView>
    </View>
  );
};

export default ShareScreen;
