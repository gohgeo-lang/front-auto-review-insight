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
    <div className="relative h-screen flex items-center justify-center bg-[#3088ff] text-white overflow-hidden"
      style={{
        animation: "splashFadeIn 0.8s ease forwards, splashFadeOut 0.8s ease forwards 1.4s",
      }}>
      <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.2),transparent_35%),radial-gradient(circle_at_80%_10%,rgba(255,255,255,0.16),transparent_30%),radial-gradient(circle_at_50%_80%,rgba(255,255,255,0.14),transparent_32%)]" />
      <div className="relative flex flex-col items-center animate-fadeIn space-y-3">
        <span className="text-4xl font-black tracking-tight">EMILY</span>
        <span className="text-white text-5xl font-black leading-none">︶</span>
        <p className="text-center text-sm text-white/90">쉽고 간편하게 확인하는 고객반응 리포트</p>
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
