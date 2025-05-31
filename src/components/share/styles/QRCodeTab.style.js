import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
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
});