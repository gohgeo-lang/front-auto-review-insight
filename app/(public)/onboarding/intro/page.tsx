"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const slides = [
  {
    title: "리뷰 자동 수집 · 요약",
    desc: "네이버·카카오·구글 리뷰를 자동으로 모으고 핵심만 정리해 드립니다.",
  },
  {
  title: "인사이트 분석",
    desc: "긍정/부정/무관 리뷰를 분류하고 키워드로 한눈에 파악합니다.",
  },
  {
    title: "여러 플랫폼 한 번에 관리",
    desc: "플랫폼별 리뷰를 통합 관리하고 대시보드 리포트로 바로 확인하세요.",
  },
];

export default function OnboardingIntro() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [skipIntro, setSkipIntro] = useState(false);
  const slide = slides[index];
  const [transitionKey, setTransitionKey] = useState(0);

  const getOnboarded = () => {
    try {
      const userJson = localStorage.getItem("user");
      const userId = userJson ? JSON.parse(userJson)?.id : null;
      const key = userId ? `onboarded:${userId}` : "onboarded";
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  };

  const next = () => {
    if (index === slides.length - 1) {
      if (skipIntro) {
        localStorage.setItem("skipIntro", "true");
      }
      const token = localStorage.getItem("token");
      const onboarded = getOnboarded();
      if (token && onboarded) return router.replace("/dashboard");
      if (token) return router.replace("/start/flow");
      return router.replace("/onboarding/login");
    } else {
      setIndex((i) => i + 1);
    }
  };

  useEffect(() => {
    // 트랜지션 키를 변경해 슬라이드가 부드럽게 전환되도록
    setTransitionKey((k) => k + 1);
  }, [index]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const skip = localStorage.getItem("skipIntro") === "true";
    const onboarded = getOnboarded();
    if (token && onboarded) {
      router.replace("/dashboard");
      return;
    }
    if (token && skip) {
      router.replace("/start/flow");
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-blue-50 to-blue-100 px-6 py-10 flex flex-col transition-opacity duration-500">
      <div className="flex justify-between items-center mb-8">
        <div className="text-sm font-bold text-blue-700">EMILY</div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
        <div
          key={transitionKey}
          className="w-full flex flex-col items-center gap-3 animate-fadeIn"
        >
          <div className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
            소개
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{slide.title}</h1>
          <p className="text-sm text-gray-700 leading-relaxed max-w-sm">
            {slide.desc}
          </p>
          <div className="flex gap-2 pt-2">
            {slides.map((_, i) => (
              <span
                key={i}
                className={`h-2 w-2 rounded-full transition-colors duration-300 ${
                  i === index ? "bg-blue-600" : "bg-gray-300"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <button
          onClick={next}
          className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm"
        >
          {index === slides.length - 1 ? "시작하기" : "다음"}
        </button>
        <button
          onClick={() => {
            if (skipIntro) localStorage.setItem("skipIntro", "true");
            const token = localStorage.getItem("token");
            const onboarded = getOnboarded();
            if (token && onboarded) return router.replace("/dashboard");
            if (token) return router.replace("/start/flow");
            return router.replace("/onboarding/login");
          }}
          className="w-full py-3 rounded-xl border text-sm text-gray-700"
        >
          건너뛰기
        </button>
      </div>
    </div>
  );
}
