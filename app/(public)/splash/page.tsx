"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SplashPage() {
  const router = useRouter();

  useEffect(() => {
    // 1.2초 뒤 온보딩으로 이동
    const timer = setTimeout(() => {
      router.replace("/onboarding");
    }, 1200);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-white animate-fadeIn">
      {/* 앱 로고 또는 브랜드 영역 */}
      <div className="flex flex-col items-center">
        <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-3xl font-bold mb-4">
          R
        </div>

        <h1 className="text-2xl font-bold text-gray-800">
          Review Auto Insight
        </h1>

        <p className="text-gray-500 text-sm mt-2">AI 리뷰 관리 서비스</p>
      </div>
    </div>
  );
}
