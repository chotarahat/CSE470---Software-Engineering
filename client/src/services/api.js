import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
});

// Attach JWT token to every request if present
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Auth ──────────────────────────────────────────────
export const register = (data) => API.post('/users/register', data);
export const login = (data) => API.post('/users/login', data);
export const resetPassword = (email, newPassword) => API.post('/users/reset-password', { email, newPassword });
export const verifyMFA=(data)=> API.post('/users/verify-mfa',data);
export const getProfile = () => API.get('/users/profile');
export const generateMFA=() => API.post('/users/generate-mfa');
export const enableMFA = (data) => API.post('/users/enable-mfa',data);

// ── Counselor management (admin) ─────────────────────
export const getCounselors = () => API.get('/users/counselors');
export const createCounselor = (data) => API.post('/users/counselors', data);
export const toggleAvailability = () => API.patch('/users/availability');

// ── Tickets ───────────────────────────────────────────
export const submitTicket = (data) => API.post('/tickets', data);
export const trackTicket = (ticketId, token) =>
  API.get(`/tickets/track/${ticketId}?token=${token}`);
export const getTickets = () => API.get('/tickets');
export const getTicketById = (id) => API.get(`/tickets/${id}`);
export const updateTicketStatus = (id, status) =>
  API.patch(`/tickets/${id}/status`, { status });
export const reassignTicket = (id, counselorId) =>
   API.patch(`/tickets/${id}/assign`, { counselorId });
export const requestConsultation = (ticketId, data) => 
  API.post(`/tickets/${ticketId}/request-call`, data);
// export const acknowledgeCrisis = (id) =>
//   API.patch(`/tickets/${id}/acknowledge-crisis`);
export const getAnalytics = () => API.get('/tickets/analytics');
export const acknowledgeCrisis = (ticketId) => API.patch(`/tickets/${ticketId}/acknowledge`);
// ── Messages ──────────────────────────────────────────
export const getMessages = (ticketId, token) =>
  API.get(`/messages/${ticketId}${token ? `?token=${token}` : ''}`);
export const sendMessage = (data) => API.post('/messages', data);
export const sendAnonymousMessage = (data) => API.post('/messages/anonymous', data);

// ── Resources ─────────────────────────────────────────
export const getResources = (params) => API.get('/resources', { params });
export const createResource = (data) => API.post('/resources', data);
export const deleteResource = (id) => API.delete(`/resources/${id}`);
export const getCategories = () => API.get('/resources/categories');
export const createCategory = (data) => API.post('/resources/categories', data);
export const rateResource = (id, rating) => API.post(`/resources/rate/${id}`, { rating });

// ── Transcripts ───────────────────────────────────────────
// Counselor / admin export — JWT required
export const exportTranscript = (ticketMongoId) =>
  API.get(`/transcripts/${ticketMongoId}/export`, { responseType: 'text' });

// Anonymous student export — token in query string
export const exportTranscriptAnonymous = (ticketMongoId, token) =>
  API.get(`/transcripts/${ticketMongoId}/export-anonymous?token=${token}`, {
    responseType: 'text',
  });

// ── Reports ───────────────────────────────────────────────
// Admin only — download full system report as .txt file
export const generateReport = () =>
  API.get('/reports/generate', { responseType: 'text' });

//Fetch Logs
export const getAuditLogs = () => API.get('/audit');
export default API;
