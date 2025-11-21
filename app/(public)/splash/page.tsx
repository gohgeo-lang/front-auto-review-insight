"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Splash() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => router.replace("/onboarding"), 1400);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-b from-black via-slate-900 to-black text-white">
      <div className="animate-fade-in scale-95 animate-bounce-in">
        <div className="w-24 h-24 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/15 flex items-center justify-center shadow-2xl">
          <span className="text-2xl font-semibold tracking-tight text-emerald-300">
            RAI
          </span>
        </div>

        <h1 className="text-center mt-6 text-xl font-semibold opacity-90">
          Review Auto Insight
        </h1>
        <p className="text-center text-xs text-gray-400 mt-2">
          리뷰를 대신 읽어주는 AI 직원
        </p>
      </div>
    </div>
  );
}
