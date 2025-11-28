"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Splash() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => router.replace("/onboarding/intro"), 2000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div
      className="relative h-screen flex items-center justify-center bg-gradient-to-b from-white via-blue-50 to-blue-100 text-gray-900 overflow-hidden"
      style={{
        animation: "splashFadeIn 0.8s ease forwards, splashFadeOut 0.8s ease forwards 1.4s",
      }}
    >
      <div className="absolute inset-0 opacity-35 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.2),transparent_30%),radial-gradient(circle_at_80%_10%,rgba(37,99,235,0.2),transparent_25%),radial-gradient(circle_at_50%_80%,rgba(96,165,250,0.2),transparent_30%)] animate-pulse" />
      <div className="relative flex flex-col items-center animate-fadeIn">
        <div className="relative">
          <div className="absolute inset-0 rounded-3xl bg-blue-300/30 blur-2xl animate-[ping_1.6s_ease-out_infinite_0.7s]" />
          <div className="w-24 h-24 rounded-3xl bg-blue-600 text-white backdrop-blur-xl border border-white/40 flex items-center justify-center shadow-2xl animate-[bounce_1.6s_ease_infinite]">
            <span className="text-2xl font-black tracking-tight">
              RIB
            </span>
          </div>
        </div>
        <h1 className="text-center mt-6 text-2xl font-semibold text-gray-900 opacity-90 animate-pulse">
          Review Insight Bot
        </h1>
        <p className="text-center text-sm text-gray-600 mt-2">
          자동 수집 · 요약 · 인사이트
        </p>
      </div>
      <style jsx global>{`
        @keyframes splashFadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes splashFadeOut {
          from {
            opacity: 1;
            transform: translateY(0);
          }
          to {
            opacity: 0;
            transform: translateY(-6px);
          }
        }
      `}</style>
    </div>
  );
}
