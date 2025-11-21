"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";

type Step = {
  title: string;
  subtitle: string;
  description: string;
};

const STEPS: Step[] = [
  {
    title: "매일 쌓이는 리뷰,\n다 읽을 시간이 없죠?",
    subtitle: "흩어진 리뷰, 쪼개진 시간",
    description:
      "네이버, 카카오, 구글, 배달앱까지…\n하루에 수십 개씩 쌓이지만\n사장님은 매장 운영만으로도 이미 벅찹니다.",
  },
  {
    title: "AI가 대신 읽고 정리해 드려요",
    subtitle: "리뷰 자동 수집 · 요약",
    description:
      "플랫폼 상관없이 리뷰를 자동으로 모으고,\n긍정/부정을 나눠 핵심만 요약합니다.\n불만 패턴과 개선 포인트도 한눈에 보이게.",
  },
  {
    title: "응대문 생성까지 자동으로",
    subtitle: "사장님은 확인만 하시면 됩니다",
    description:
      "AI가 상황에 맞는 응대문을 먼저 제안합니다.\n사장님은 손볼 곳만 살짝 수정해서 등록하면 끝.\n리뷰 관리는 ‘보고 승인하는 일’이 됩니다.",
  },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const router = useRouter();
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const handleNext = () => {
    if (!isLast) setStep(step + 1);
    else router.push("/auth/login");
  };

  const handleSkip = () => router.push("/auth/login");

  return (
    <div className="flex h-screen w-full flex-col bg-slate-950 text-white">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-6 pt-5">
        <span className="text-xs font-medium text-emerald-300">REVIEW AI</span>
        <button
          onClick={handleSkip}
          className="text-xs text-gray-300 underline underline-offset-4"
        >
          건너뛰기
        </button>
      </div>

      {/* 본문 */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center animate-fade-in">
        {/* Step Indicator Text */}
        <div className="mb-4 rounded-full border border-emerald-400/40 bg-emerald-400/10 px-3 py-1 text-[10px] font-medium text-emerald-200">
          STEP {step + 1} / {STEPS.length}
        </div>

        {/* 타이틀 */}
        <h2 className="whitespace-pre-line text-2xl font-semibold leading-snug tracking-tight">
          {current.title}
        </h2>

        {/* 서브타이틀 */}
        <p className="mt-4 text-sm font-medium text-emerald-200">
          {current.subtitle}
        </p>

        {/* 설명 */}
        <p className="mt-3 whitespace-pre-line text-xs leading-relaxed text-gray-300">
          {current.description}
        </p>

        {/* 중앙 그래픽 카드 */}
        <div className="mt-8 flex h-32 w-32 items-center justify-center rounded-3xl bg-slate-900/70 border border-emerald-400/40 shadow-[0_0_40px_rgba(16,185,129,0.25)] transition-all">
          {step === 0 && (
            <div className="space-y-1 text-[9px] text-slate-200">
              <div className="rounded-md bg-slate-800 px-2 py-1 shadow">
                네이버 ★ 4.8
              </div>
              <div className="rounded-md bg-slate-800 px-2 py-1 shadow">
                카카오맵 리뷰 127개
              </div>
              <div className="rounded-md bg-slate-800 px-2 py-1 shadow">
                구글 리뷰 53개
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-2 text-[9px] text-left">
              <div className="rounded-md bg-emerald-400/20 px-2 py-1 backdrop-blur-sm shadow">
                👍 커피 맛이 항상 일정해요
              </div>
              <div className="rounded-md bg-emerald-400/20 px-2 py-1 backdrop-blur-sm shadow">
                👍 직원분들이 너무 친절합니다
              </div>
              <div className="rounded-md bg-red-400/20 px-2 py-1 backdrop-blur-sm shadow">
                ⚠️ 주차 안내가 조금 헷갈렸어요
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-2 text-[9px] text-left">
              <div className="rounded-md bg-slate-800 px-2 py-1">
                🙋 손님: “음료가 너무 늦게 나왔어요”
              </div>
              <div className="rounded-md bg-emerald-400/25 px-2 py-1">
                🤖 AI: “불편을 드려 죄송합니다...” 초안 생성
              </div>
              <div className="rounded-md bg-slate-800 px-2 py-1">
                ✍️ 사장님: 한 줄만 손보고 등록
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 하단 */}
      <div className="mb-7 flex flex-col gap-4 px-8">
        {/* 하단 인디케이터 */}
        <div className="flex items-center justify-center gap-2">
          {STEPS.map((_, idx) => (
            <div
              key={idx}
              className={`h-2 rounded-full transition-all ${
                idx === step ? "w-6 bg-emerald-400" : "w-2 bg-slate-600"
              }`}
            />
          ))}
        </div>

        {/* CTA 버튼 */}
        <Button
          onClick={handleNext}
          className="h-11 w-full rounded-full bg-emerald-400 text-xs font-semibold text-slate-950 hover:bg-emerald-300"
        >
          {isLast ? "지금 바로 시작하기" : "다음"}
        </Button>

        <p className="text-center text-[10px] text-slate-500">
          이후에는 설정에서 온보딩을 다시 볼 수 있어요.
        </p>
      </div>
    </div>
  );
}
