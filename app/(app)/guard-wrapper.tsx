"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

export function GuardWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;
    let userId: string | null = null;
    const token = localStorage.getItem("token");
    try {
      const userJson = localStorage.getItem("user");
      if (userJson) userId = JSON.parse(userJson)?.id || null;
    } catch {
      userId = null;
    }

    // 온보딩 차단 로직 비활성화: 현재는 접근을 막지 않음
  }, [router, pathname]);

  return <>{children}</>;
}
