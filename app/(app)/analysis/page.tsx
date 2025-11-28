"use client";

import { useRouter } from "next/navigation";

const painPoints = [
  "리뷰가 쌓여도 무엇을 먼저 개선해야 할지 모르겠어요.",
  "긍정/부정 피드백이 섞여 있어 매장 운영 방향을 잡기 어렵습니다.",
  "직접 리뷰를 읽을 시간도 없고, 주기적인 리포트가 필요해요.",
];

const solutions = [
  "자동 수집·분석으로 리뷰를 대신 읽어드립니다.",
  "긍정/부정 키워드와 감성 분포를 한눈에 정리합니다.",
  "주간/월간 리포트를 발행해 운영 방향을 제시합니다.",
];

export default function AnalysisPitchPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-sky-50 pt-[60px] pb-[90px] px-4 space-y-6 animate-fadeIn relative">
      <section className="space-y-2">
        <p className="text-xs uppercase text-blue-600 font-semibold">Analysis</p>
        <h1 className="text-2xl font-bold text-gray-900">고객 반응, 읽기 어렵다면?</h1>
        <p className="text-sm text-gray-700">
          매장 운영에 고민이 많다면, 리뷰를 대신 수집·분석해 핵심만 전달해 드립니다.
        </p>
      </section>

      <section className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 space-y-2">
        <p className="text-sm font-semibold text-gray-800">이런 점이 어렵다면</p>
        <ul className="text-sm text-gray-700 space-y-1">
          {painPoints.map((p) => (
            <li key={p} className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-500" />
              <span>{p}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 space-y-2">
        <p className="text-sm font-semibold text-gray-800">우리가 해결해 드립니다</p>
        <ul className="text-sm text-gray-700 space-y-1">
          {solutions.map((s) => (
            <li key={s} className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-indigo-500" />
              <span>{s}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-gradient-to-r from-sky-500 to-indigo-500 text-white rounded-2xl p-4 shadow-sm space-y-2">
        <p className="text-sm font-semibold">리뷰 읽기 대신, 인사이트만 받으세요</p>
        <p className="text-xs text-blue-50">
          자동 수집·요약·리포트까지 한 번에. 무료 1회 체험 후 주기 리포트로 편하게 운영하세요.
        </p>
      </section>

      <section className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 space-y-2">
        <p className="text-sm font-semibold text-gray-800">무엇을 받아볼 수 있나요?</p>
        <ul className="text-sm text-gray-700 space-y-1">
          <li className="flex items-start gap-2">
            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-green-500" />
            <span>긍정/부정 감성 분포와 상위 키워드</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-green-500" />
            <span>최근 30일 리뷰 요약(무료 1회) 및 주기 리포트 발행(구독/건당)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-green-500" />
            <span>운영 개선 포인트 제안(키워드 기반)</span>
          </li>
        </ul>
      </section>

      {/* 고정 CTA */}
      <div className="fixed bottom-[80px] left-1/2 -translate-x-1/2 w-full max-w-[430px] px-4">
        <button
          onClick={() => router.push("/start/flow")}
          className="w-full py-3 rounded-xl bg-blue-600 text-white text-sm font-semibold shadow-lg active:scale-95"
        >
          고객 반응 스캔하기
        </button>
      </div>
    </div>
  );
}
