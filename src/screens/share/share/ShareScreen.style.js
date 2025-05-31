import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  tabContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: "#2196f3",
  },
  tabButtonText: {
    fontSize: 16,
    marginLeft: 8,
    color: "#666",
  },
  activeTabButtonText: {
    color: "#2196f3",
    fontWeight: "500",
  },
  codeContainer: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  codeHeaderContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  codeHeader: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  codeSubheader: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  codeContentContainer: {
    alignItems: "center",
    width: "100%",
  },
  codeDisplay: {
    padding: 16,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    marginBottom: 16,
    width: "100%",
    alignItems: "center",
  },
  codeText: {
    fontSize: 24,
    fontWeight: "bold",
    letterSpacing: 2,
  },
  expirationText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 24,
  },
  codeActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 16,
  },
  newCodeButton: {
    marginTop: 24,
  },
  noCodeContainer: {
    alignItems: "center",
  },
  noCodeText: {
    fontSize: 16,
    color: "#666",
    marginBottom: 24,
    textAlign: "center",
  },
  generateButton: {
    minWidth: 200,
  },
  errorText: {
    color: "#f44336",
    marginTop: 16,
    textAlign: "center",
  },
});
