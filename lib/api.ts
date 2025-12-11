import axios from "axios";
import toast from "react-hot-toast";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const status = err.response?.status;

    if (status === 401) {
      // 토큰만 제거 (즉시 redirect 금지)
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        toast.error("다시 로그인해주세요.");
      }
    }

    return Promise.reject(err);
  }
);
