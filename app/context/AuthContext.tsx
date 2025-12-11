 "use client";

import { createContext, useEffect, useState, ReactNode, useCallback } from "react";
import { api } from "@/lib/api";
import toast from "react-hot-toast";

interface User {
  id: string;
  email: string;
  storeName?: string;
  storeUrl?: string;
  placeId?: string;
  onboarded?: boolean;
  subscriptionStatus?: string;
  subscriptionTier?: string | null;
  storeQuota?: number;
  extraCredits?: number;
  lastFreeTokenAt?: string | null;
  nextBillingAt?: string | null;
  lastBilledAt?: string | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  refresh: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // 최초 로드 시 localStorage에서 유저 정보 가져오기
  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      const userJson = localStorage.getItem("user");

      if (token && userJson) {
        try {
          setUser(JSON.parse(userJson));
        } catch {
          setUser(null);
        }
      }
    }
    setLoading(false);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const res = await api.get<User>("/auth/me");
      const nextUser = res.data;
      localStorage.setItem("user", JSON.stringify(nextUser));
      setUser(nextUser);
    } catch {
      // ignore
    }
  }, []);

  const login = (token: string, user: User) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    if (user?.id && user?.onboarded) {
      localStorage.setItem(`onboarded:${user.id}`, "true");
    }
    setUser(user);
    toast.success("로그인되었습니다.");
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    // onboarded 플래그는 유지 (다시 로그인 시 활용)
    setUser(null);
    toast.success("로그아웃되었습니다.");
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}
