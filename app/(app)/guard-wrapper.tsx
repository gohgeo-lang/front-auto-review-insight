"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

export function GuardWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;
    let userId: string | null = null;
    try {
      const userJson = localStorage.getItem("user");
      if (userJson) userId = JSON.parse(userJson)?.id || null;
    } catch {
      userId = null;
    }

    const key = userId ? `onboarded:${userId}` : "onboarded";
    const onboarded = localStorage.getItem(key);

    // 온보딩/인증/스플래시/인트로는 허용, 그 외는 온보딩 완료 필요
    const isAllowedPath =
      pathname.startsWith("/onboarding") ||
      pathname.startsWith("/auth") ||
      pathname === "/" ||
      pathname.startsWith("/start") ||
      pathname.startsWith("/setup-store") ||
      pathname.startsWith("/home");

    if (!onboarded && !isAllowedPath) {
      router.replace("/start");
    }
  }, [router, pathname]);

  return <>{children}</>;
}
