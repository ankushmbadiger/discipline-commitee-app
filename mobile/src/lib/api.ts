import axios from "axios";
import { getAuthToken } from "./auth";

const api = axios.create({
  baseURL: "http://192.168.1.9:5000/api",
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach Firebase ID token to authenticated requests.
api.interceptors.request.use(async (config) => {
  const token = await getAuthToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;