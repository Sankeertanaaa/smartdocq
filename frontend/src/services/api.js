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

export default api;