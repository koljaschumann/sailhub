export { supabase } from './client.js';
export { AuthProvider, useAuth, getAuthUrl } from './useAuth.jsx';
export {
  scrapeManage2Sail,
  parseRegattaResults,
  findSailorResult,
  searchManage2SailRegattas,
  extractRegattaDetails,
  extractEventDetails
} from './manage2sail.js';
export { submitTicket, submitDeletionNotice } from './tickets.js';
