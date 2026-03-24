// src/api/api.ts
import axios from "axios";
import { getAccessToken } from "../modules/auth/tokenStorage";

export const api = axios.create({
  baseURL: "/", // Nginx routet /api/... aufs Backend
  withCredentials: false,
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
