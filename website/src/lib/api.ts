
import axios from "axios";
import { getIdToken } from "firebase/auth";
import { auth } from "./firebase";

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;

  if (user) {
    const token = await getIdToken(user);
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;
