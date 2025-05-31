import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { styles } from './styles/DocumentOptionsBottomSheet.style';

const DocumentOptionsBottomSheet = ({ visible, onClose, onCreateNew, onScanQR }) => {
  
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={{ flex: 1 }}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>
        
        <View style={styles.bottomSheet}>
          <View style={styles.handle} />
          
          <Text style={styles.title}>O que você deseja fazer?</Text>
          
          <TouchableOpacity style={styles.optionButton} onPress={onScanQR}>
            <View style={[styles.iconContainer, styles.scanIconContainer]}>
              <Feather name="camera" size={24} color="#2196f3" />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Escanear QR Code</Text>
              <Text style={styles.optionDescription}>
                Escanear QR Code de um documento compartilhado
              </Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.optionButton} onPress={onCreateNew}>
            <View style={[styles.iconContainer, styles.newIconContainer]}>
              <Feather name="file-plus" size={24} color="#4caf50" />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Criar novo documento</Text>
              <Text style={styles.optionDescription}>
                Iniciar um documento em branco
              </Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default DocumentOptionsBottomSheet;