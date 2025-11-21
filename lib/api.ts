import axios from "axios";

// API 인스턴스 생성
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000",
});

// =========================
// 1) Request Interceptor
// =========================
api.interceptors.request.use(
  (config) => {
    // 클라이언트 환경에서만 localStorage 접근 가능
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// =========================
// 2) Response Interceptor
// =========================
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 인증 만료 또는 유효하지 않은 토큰
    if (error.response?.status === 401) {
      // 자동 로그아웃 처리
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        // 로그인 페이지로 이동
        window.location.href = "/auth/login";
      }
    }

    return Promise.reject(error);
  }
);
