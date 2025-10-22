import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://smartdocq-ne65.onrender.com';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 300000, // 5 minutes timeout for uploads (model loading on free tier)
  // Don't set default Content-Type - let axios handle it based on data type
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Skip adding auth headers for static files (manifest.json, etc.)
    const isStaticFile = config.url && (
      config.url.includes('manifest.json') || 
      config.url.includes('.ico') ||
      config.url.includes('.png') ||
      config.url.includes('.jpg')
    );
    
    if (!isStaticFile) {
      // Add auth token to API requests only
      const token = localStorage.getItem('token');
      console.log('API Request:', config.url, 'Token from localStorage:', token ? `${token.substring(0, 20)}...` : 'none');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    
    // Set Content-Type for JSON requests only (not for FormData)
    if (config.data && !(config.data instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json';
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Ignore errors for static files (manifest.json, etc.)
    const isStaticFile = error?.config?.url && (
      error.config.url.includes('manifest.json') || 
      error.config.url.includes('.ico') ||
      error.config.url.includes('.png') ||
      error.config.url.includes('.jpg')
    );
    
    if (isStaticFile) {
      // Silently ignore static file errors
      return Promise.reject(error);
    }
    
    // Allow callers to suppress console noise for expected errors (e.g., 401 during silent token verify)
    const shouldLog = !error?.config?.suppressLog && !(error?.response?.status === 401 && error?.config?.suppressLog);
    
    if (shouldLog && error?.response?.status !== 401) {
      console.error('API Error:', error);
    }
    
    // Handle 401 errors from token verification
    if (error?.response?.status === 401 && error?.config?.url?.includes('/auth/verify')) {
      // Clear invalid/expired token
      console.log('Token verification failed - clearing token');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Silent fail for token verification - let the app handle redirect
      return Promise.reject(error);
    }
    
    // Handle other 401 errors (expired token during API calls)
    if (error?.response?.status === 401) {
      console.log('Unauthorized - clearing token');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Redirect to login if not already there
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export const uploadService = {
  warmupModel: async () => {
    const response = await api.get('/api/warmup');
    return response.data;
  },

  uploadDocument: async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    // Don't set Content-Type header for FormData, let the browser set it
    // This ensures the Authorization header from the interceptor is preserved
    const response = await api.post('/api/upload', formData);
    return response.data;
  },

  listDocuments: async () => {
    const response = await api.get('/api/documents');
    return response.data;
  },

  deleteDocument: async (documentId) => {
    const response = await api.delete(`/api/documents/${documentId}`);
    return response.data;
  },
};

export const chatService = {
  sendMessage: async (question, sessionId, documentId = null) => {
    const response = await api.post('/api/chat', {
      question,
      session_id: sessionId,
      document_id: documentId,
    });
    return response.data;
  },

  generateFollowUpQuestions: async (question, sessionId, documentId = null) => {
    const response = await api.post('/api/chat/follow-up', {
      question,
      session_id: sessionId,
      document_id: documentId,
    });
    return response.data;
  },

  summarizeDocument: async (documentId = null) => {
    const response = await api.post('/api/chat/summarize', { document_id: documentId });
    return response.data;
  },

  extractKeyPoints: async (documentId = null) => {
    const response = await api.post('/api/chat/key-points', { document_id: documentId });
    return response.data;
  },
};

export const historyService = {
  getHistory: async (sessionId = null, limit = 50) => {
    const params = { limit };
    if (sessionId) params.session_id = sessionId;
    
    const response = await api.get('/api/history', { params });
    return response.data;
  },

  saveHistory: async (chatItem) => {
    const response = await api.post('/api/history', chatItem);
    return response.data;
  },

  deleteSession: async (sessionId) => {
    const response = await api.delete(`/api/history/${sessionId}`);
    return response.data;
  },

  listSessions: async (userId = null, includeArchived = false, limit = 50) => {
    const params = { limit };
    if (userId) params.user_id = userId;
    if (includeArchived) params.include_archived = includeArchived;
    
    const response = await api.get('/api/history/sessions', { params });
    return response.data;
  },

  listUserSessions: async (userId) => {
    const response = await api.get(`/api/history/sessions/${encodeURIComponent(userId)}`);
    return response.data;
  },

  updateSession: async (sessionId, updateData) => {
    const response = await api.put(`/api/history/sessions/${sessionId}`, updateData);
    return response.data;
  },

  generateSessionTitle: async (sessionId) => {
    const response = await api.post(`/api/history/sessions/${sessionId}/generate-title`);
    return response.data;
  },

  generateSessionSummary: async (sessionId) => {
    const response = await api.post(`/api/history/sessions/${sessionId}/generate-summary`);
    return response.data;
  },

  searchHistory: async (query, userId = null, limit = 20) => {
    const params = { query, limit };
    if (userId) params.user_id = userId;
    
    const response = await api.get('/api/history/search', { params });
    return response.data;
  },

  archiveSession: async (sessionId) => {
    const response = await api.post(`/api/history/sessions/${sessionId}/archive`);
    return response.data;
  },

  unarchiveSession: async (sessionId) => {
    const response = await api.post(`/api/history/sessions/${sessionId}/unarchive`);
    return response.data;
  },

  createSession: async (sessionData) => {
    const response = await api.post('/api/history/sessions', sessionData);
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/api/history/stats');
    return response.data;
  },
};

export const feedbackService = {
  submitFeedback: async (feedback) => {
    const response = await api.post('/api/feedback', feedback);
    return response.data;
  },

  getFeedbackStats: async () => {
    const response = await api.get('/api/feedback');
    return response.data;
  },

  getSessionFeedback: async (sessionId) => {
    const response = await api.get(`/api/feedback/session/${sessionId}`);
    return response.data;
  },

  getAnalytics: async () => {
    const response = await api.get('/api/feedback/analytics');
    return response.data;
  },
};

export const demoService = {
  getSamples: async () => {
    const response = await api.get('/api/demo/samples');
    return response.data;
  },

  askDemo: async (question, sessionId, documentId = null) => {
    const response = await api.post('/api/demo/chat', {
      question,
      session_id: sessionId,
      document_id: documentId,
    });
    return response.data;
  },

  uploadDemoDocument: async (sessionId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/api/demo/upload?session_id=${encodeURIComponent(sessionId)}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};

export const authService = {
  login: async (email, password) => {
    const response = await api.post('/api/auth/login', {
      email,
      password,
    });
    return response.data;
  },

  register: async (userData) => {
    const response = await api.post('/api/auth/register', userData);
    return response.data;
  },

  verifyToken: async (token) => {
    const response = await api.get('/api/auth/verify', {
      headers: {
        Authorization: `Bearer ${token}`, // Send with Bearer prefix
      },
      // Suppress console logging for expected 401s during token verification
      suppressLog: true,
    });
    return response.data;
  },

  logout: async () => {
    const response = await api.post('/api/auth/logout');
    return response.data;
  },

  getAllUsers: async () => {
    const response = await api.get('/api/auth/users');
    return response.data;
  },
};

export default api; 