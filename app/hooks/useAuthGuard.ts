"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import useAuth from "./useAuth";

type GuardOptions = {
  requireOnboarded?: boolean;
  fallback?: string; // 미인증 시 이동
};

export default function useAuthGuard(options?: GuardOptions) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const redirected = useRef(false);
  const [checking, setChecking] = useState(true);

  const fallback = options?.fallback || "/onboarding/intro";
  const requireOnboarded = options?.requireOnboarded || false;

  useEffect(() => {
    if (loading) return;
    if (redirected.current) return;

    if (!user) {
      redirected.current = true;
      router.replace(fallback);
      setChecking(false);
      return;
    }

    if (requireOnboarded && !user.onboarded) {
      redirected.current = true;
      router.replace("/start/flow");
      setChecking(false);
      return;
    }

    setChecking(false);
  }, [loading, user, router, fallback, requireOnboarded]);

  return { user, loading: loading || checking };
}
