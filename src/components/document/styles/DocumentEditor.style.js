import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#f5f5f5",
  },
  titleInput: {
    fontSize: 24,
    fontWeight: "bold",
    padding: 16,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  contentInput: {
    flex: 1,
    fontSize: 16,
    padding: 16,
    textAlignVertical: "top",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  button: {
    minWidth: 100,
  },
  offlineIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ff9800",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    marginRight: 8,
  },
  offlineText: {
    color: "#fff",
    fontSize: 12,
    marginLeft: 4,
  },
  savingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2196f3",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    marginRight: 8,
  },
  savingText: {
    color: "#fff",
    fontSize: 12,
    marginLeft: 4,
  },
  collaborationIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4caf50",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  collaborationText: {
    color: "#fff",
    fontSize: 12,
    marginLeft: 4,
  },
});
