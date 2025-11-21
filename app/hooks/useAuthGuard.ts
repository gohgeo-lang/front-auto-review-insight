"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import useAuth from "./useAuth";

export default function useAuthGuard() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    // 아직 로딩 중이면 아무것도 하지 않음
    if (loading) return;

    // 로그인 안 된 경우 → 로그인 화면으로
    if (!user) {
      router.replace("/auth/login");
    }
  }, [loading, user, router]);

  return { user, loading };
}
