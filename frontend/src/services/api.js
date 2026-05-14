import axios from "axios";

const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  "https://smartdocq-ne65.onrender.com";

console.log("API BASE URL:", API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    console.log(
      "FULL API URL:",
      `${config.baseURL}${config.url}`
    );

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error);
    return Promise.reject(error);
  }
);


// ================= AUTH SERVICE =================

export const authService = {
  register: async (userData) => {
    console.log(
    "REGISTER FULL URL:",
    `${API_BASE_URL}/api/auth/register`);
    const response = await api.post(
    "/api/auth/register",
    userData);
    return response.data;
  },
  
  login: async (credentials) => {
    console.log(
    "LOGIN FULL URL:",
    `${API_BASE_URL}/api/auth/login`);
    const response = await api.post(
      "/api/auth/login",
      credentials);
      return response.data;
    },

  verifyToken: async () => {
    const response = await api.get(
      "/api/auth/verify"
    );
    return response.data;
  },

  logout: async () => {
    const response = await api.post(
      "/api/auth/logout"
    );
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get(
      "/api/auth/me"
    );
    return response.data;
  },
};

// ================= UPLOAD SERVICE =================

export const uploadService = {
  uploadDocument: async (formData) => {
    const response = await api.post(
      "/api/upload",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return response.data;
  },
};


// ================= CHAT SERVICE =================

export const chatService = {
  sendMessage: async (data) => {
    const response = await api.post(
      "/api/chat",
      data
    );

    return response.data;
  },
};

// ================= FEEDBACK SERVICE =================

export const feedbackService = {
  submitFeedback: async (data) => {
    const response = await api.post(
      "/api/feedback",
      data
    );

    return response.data;
  },

  getFeedback: async () => {
    const response = await api.get(
      "/api/feedback"
    );

    return response.data;
  },
};

// ================= DEMO SERVICE =================

export const demoService = {
  getDemoDocuments: async () => {
    const response = await api.get(
      "/api/demo/documents"
    );

    return response.data;
  },

  askDemoQuestion: async (data) => {
    const response = await api.post(
      "/api/demo/chat",
      data
    );

    return response.data;
  },
};

// ================= HISTORY SERVICE =================

export const historyService = {
  getHistory: async () => {
    const response = await api.get(
      "/api/history"
    );
    return response.data;
  },

  deleteHistoryItem: async (id) => {
    const response = await api.delete(
      `/api/history/${id}`
    );
    return response.data;
  },
};

export default api;