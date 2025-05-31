import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  tabsContainer: {
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    paddingVertical: 10,
    paddingHorizontal: 10,
    backgroundColor: "#fff",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginRight: 5,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: "#e3f2fd",
  },
  tabText: {
    marginLeft: 5,
    fontSize: 15,
    color: "#666",
  },
  activeTabText: {
    color: "#2196f3",
    fontWeight: "600",
  },
  contentContainer: {
    padding: 20,
    flex: 1,
  },
  // Seção de colaboradores
  collaboratorsContainer: {
    flex: 1,
  },
  addCollaboratorContainer: {
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
    color: "#333",
  },
  // Seção de email
  emailFormContainer: {
    paddingVertical: 20,
  },
  permissionSelector: {
    marginVertical: 15,
  },
  permissionLabel: {
    fontSize: 16,
    color: "#666",
    marginBottom: 8,
  },
  permissionOptions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 8,
  },
  permissionOption: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
  },
  permissionOptionActive: {
    backgroundColor: "#e3f2fd",
    borderColor: "#2196f3",
    borderWidth: 1,
  },
  permissionText: {
    fontSize: 14,
    color: "#666",
  },
  permissionTextActive: {
    color: "#2196f3",
    fontWeight: "600",
  },
  emailFormActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 20,
  },
  cancelButton: {
    marginRight: 10,
  },
  // Seção de QR Code
  noQrCodeContainer: {
    flex: 1,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 300,
  },
  noQrCodeText: {
    fontSize: 16,
    textAlign: "center",
    color: "#666",
    marginBottom: 20,
  },
  generateButton: {
    minWidth: 200,
  },
  qrContainer: {
    alignItems: "center",
    padding: 20,
  },
  qrCodeHeaderContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  codeHeader: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
    marginTop: 10,
    marginBottom: 6,
    textAlign: "center",
  },
  codeSubheader: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  qrCodeWrapper: {
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    marginBottom: 24,
  },
  qrCodeActions: {
    marginVertical: 20,
  },
  linkContainer: {
    width: "100%",
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 16,
    marginVertical: 10,
  },
  linkTitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  linkText: {
    fontSize: 15,
    color: "#333",
    marginBottom: 16,
  },
  linkActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  linkButton: {
    marginHorizontal: 5,
  },
  // Seção de escanear
  scanContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    minHeight: 300,
  },
  scanTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#333",
    marginBottom: 12,
    textAlign: "center",
  },
  scanSubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
  },
  scanButton: {
    minWidth: 200,
  },
});
