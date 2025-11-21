"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import useAuth from "./useAuth";

export default function useAuthGuard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const redirected = useRef(false);

  useEffect(() => {
    if (loading) return; // 아직 준비 안 됨

    // 이미 redirect 한 적 있으면 또 실행 금지
    if (redirected.current) return;

    if (!user) {
      redirected.current = true;
      router.replace("/auth/login");
    }
  }, [loading, user, router]);

  return { user, loading };
}
