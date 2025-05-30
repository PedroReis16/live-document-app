import { baseApiService } from './BaseApiService';
import authService from './auth';
import userService from './user';
import documentService from './documents';
import shareService from './share';

// Exporta a instância do serviço base
export const api = baseApiService.api;

// Cria um serviço combinado para compatibilidade retroativa
const ApiService = {
  // Métodos de autenticação
  login: authService.login.bind(authService),
  register: authService.register.bind(authService),
  logout: authService.logout.bind(authService),
  requestPasswordReset: authService.requestPasswordReset.bind(authService),
  resetPassword: authService.resetPassword.bind(authService),
  verifyResetToken: authService.verifyResetToken.bind(authService),
  setAuthToken: authService.setAuthToken.bind(authService),
  
  // Métodos de usuário
  getUserProfile: userService.getUserProfile.bind(userService),
  updateProfile: userService.updateProfile.bind(userService),
  updatePassword: userService.updatePassword.bind(userService),
  uploadAvatar: userService.uploadAvatar.bind(userService),
  removeAvatar: userService.removeAvatar.bind(userService),
  updatePreferences: userService.updatePreferences.bind(userService),
  
  // Métodos de documentos
  getDocuments: documentService.getDocuments.bind(documentService),
  getDocument: documentService.getDocument.bind(documentService),
  createDocument: documentService.createDocument.bind(documentService),
  updateDocument: documentService.updateDocument.bind(documentService),
  deleteDocument: documentService.deleteDocument.bind(documentService),
  getDocumentHistory: documentService.getDocumentHistory.bind(documentService),
  restoreDocumentVersion: documentService.restoreDocumentVersion.bind(documentService),
  exportDocument: documentService.exportDocument.bind(documentService),
  
  // Métodos de compartilhamento
  shareDocument: shareService.shareDocument.bind(shareService),
  revokeDocumentAccess: shareService.revokeDocumentAccess.bind(shareService),
  updateUserPermission: shareService.updateUserPermission.bind(shareService),
  getDocumentShares: shareService.getDocumentShares.bind(shareService),
  createPublicLink: shareService.createPublicLink.bind(shareService),
  revokePublicLink: shareService.revokePublicLink.bind(shareService),
  joinSharedDocument: shareService.joinSharedDocument.bind(shareService),
  getSharedWithMeDocuments: shareService.getSharedWithMeDocuments.bind(shareService),
};

// Exporta os serviços individuais para uso direto
export { 
  authService,
  userService,
  documentService,
  shareService,
};

// Exporta o serviço agregado como padrão para compatibilidade
export default ApiService;
