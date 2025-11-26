"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Splash() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      let userOnboarded = false;
      try {
        const userJson = localStorage.getItem("user");
        if (userJson) {
          const parsed = JSON.parse(userJson);
          const key = parsed?.id ? `onboarded:${parsed.id}` : "onboarded";
          const localFlag = key ? localStorage.getItem(key) : null;
          if (parsed?.id && parsed.onboarded) {
            localStorage.setItem(key, "true");
            userOnboarded = true;
          } else if (localFlag) {
            userOnboarded = true;
          }
        }
      } catch {
        userOnboarded = false;
      }

      if (token && userOnboarded) {
        router.replace("/dashboard");
        return;
      }
    }
    const timer = setTimeout(() => {
      router.replace("/onboarding/intro");
    }, 1000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-white to-blue-50 px-6 py-10 space-y-4">
      <div className="text-center space-y-2">
        <div className="text-xs font-semibold text-blue-700 tracking-wide">
          RIB · Review Insight Bot
        </div>
        <h1 className="text-4xl font-bold text-gray-900">RIB</h1>
      </div>
    </div>
  );
}
