"use client";

import { useEffect, useState, type ReactNode } from "react";
import useAuthGuard from "@/app/hooks/useAuthGuard";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import Link from "next/link";

type ProgressStep = {
  label: string;
  detail: string;
};

const steps: ProgressStep[] = [
  { label: "대기 중", detail: "준비 중입니다." },
  { label: "네이버 수집", detail: "네이버에서 리뷰 가져오는 중" },
  { label: "정리 중", detail: "리뷰 정제 및 저장 중" },
  { label: "AI 분석", detail: "감성/키워드 분석 중" },
  { label: "완료", detail: "작업이 완료되었습니다." },
];

export default function HomeCollector() {
  const router = useRouter();
  const { loading: authLoading, user } = useAuthGuard();
  const [progress, setProgress] = useState(0);
  const [statusIdx, setStatusIdx] = useState(0);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [added, setAdded] = useState<number | null>(null);

  const placeId = user?.placeId;
  const step = steps[Math.min(statusIdx, steps.length - 1)];

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (busy) {
      timer = setInterval(() => {
        setProgress((p) => Math.min(p + 5, 95));
        setStatusIdx((s) => Math.min(s + 1, steps.length - 2));
      }, 700);
    } else {
      setProgress(0);
      setStatusIdx(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [busy]);

  const disabled = busy || !placeId;

  async function runNaver(withAnalysis = false) {
    if (!placeId) {
      router.push("/setup-store");
      return;
    }
    setBusy(true);
    setMessage("");
    setAdded(null);
    try {
      const res = await api.post("/crawler/naver", { placeId });
      setAdded(res.data?.added ?? 0);
      setProgress(withAnalysis ? 60 : 100);
      setStatusIdx(withAnalysis ? steps.length - 2 : steps.length - 1);
      setMessage(`네이버에서 ${res.data?.added ?? 0}개 수집 완료`);

      if (withAnalysis) {
        try {
          await api.post("/ai/summary/missing");
          setStatusIdx(steps.length - 1);
          setProgress(100);
          setMessage("수집 + AI 분석이 완료되었습니다.");
          const key = user?.id ? `onboarded:${user.id}` : "onboarded";
          localStorage.setItem(key, "true");
          try {
            await api.post("/auth/complete-onboarding");
            if (user) {
              const updated = { ...user, onboarded: true };
              localStorage.setItem("user", JSON.stringify(updated));
            }
          } catch (err) {
            console.error("온보딩 완료 플래그 업데이트 실패", err);
          }
        } catch (err: any) {
          const status = err?.response?.status;
          const apiError = err?.response?.data?.error;
          if (status === 429 || apiError === "OPENAI_QUOTA_EXCEEDED") {
            setMessage("AI 쿼터를 초과했습니다. 키/요금제를 확인해 주세요.");
          } else {
            setMessage("AI 분석에 실패했습니다. 잠시 후 다시 시도해 주세요.");
          }
        }
      }
    } catch (err: any) {
      setMessage("수집 실패. 네트워크나 placeId를 확인해주세요.");
    } finally {
      setBusy(false);
    }
  }

  if (authLoading || !user) {
    return <div className="p-8 text-center text-gray-500">불러오는 중...</div>;
  }

  return (
    <div className="min-h-screen bg-[#fafafa] pt-[50px] pb-[90px] px-4 space-y-6 animate-fadeIn">
      <section>
        <h1 className="text-2xl font-bold">리뷰 수집</h1>
        <p className="text-gray-600 text-sm mt-1">
          연결된 채널에서 최신 리뷰를 불러옵니다.
        </p>
      </section>

      {/* 온보딩 가이드 */}
      <section className="bg-white border rounded-xl shadow-sm p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-blue-600 font-semibold">빠른 시작</p>
            <p className="text-sm text-gray-700">
              채널 연결 → 수집 → 분석 순서로 진행하세요.
            </p>
          </div>
          <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
            Step-by-step
          </span>
        </div>

        <div className="space-y-3">
          <OnboardStep
            title="채널 연결"
            desc="네이버/카카오/구글 채널을 연결해 placeId를 등록하세요."
            status={placeId ? "완료" : "필요"}
            action={
              <div className="flex gap-2">
                {["네이버", "카카오", "구글"].map((ch) => (
                  <button
                    key={ch}
                    onClick={() => router.push("/setup-store")}
                    className="px-3 py-2 border rounded-lg text-xs text-gray-700"
                  >
                    {ch} 연결
                  </button>
                ))}
              </div>
            }
          />
          <OnboardStep
            title="리뷰 수집"
            desc="버튼 한 번으로 최신 리뷰를 모읍니다."
            status={busy ? "진행중" : added ? "완료" : "대기"}
          />
          <OnboardStep
            title="분석/리포트"
            desc="감성·키워드 분석 후 대시보드 리포트를 확인하세요."
            status={statusIdx >= steps.length - 1 ? "완료" : "대기"}
          />
        </div>

        <div className="text-xs text-gray-500">
          예시 데이터와 리포트는 대시보드에서 확인할 수 있습니다. 수집/분석 진행
          상황은 아래 진행률에서 확인하세요.
        </div>
      </section>

      <section className="bg-white border rounded-xl shadow-sm p-4 space-y-4">
        <div>
          <p className="text-sm text-gray-600 mb-1">네이버</p>
          <p className="text-xs text-gray-500">
            placeId: {placeId || "미설정"}
          </p>
        </div>

        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="text-sm text-gray-700">
          {step.label} · {step.detail}
        </div>
        {message && <div className="text-sm text-blue-600">{message}</div>}
        {added !== null && (
          <div className="text-sm text-gray-700">
            총 {added}개가 추가되었습니다.
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => runNaver(true)}
            disabled={disabled}
            className={`flex-1 py-3 rounded-lg text-white text-sm font-semibold ${
              disabled ? "bg-gray-400" : "bg-green-600"
            }`}
          >
            {busy ? "진행 중..." : "빠른 시작 (수집+분석)"}
          </button>
          <button
            onClick={() => runNaver(false)}
            disabled={disabled}
            className={`flex-1 py-3 rounded-lg text-white text-sm font-semibold ${
              disabled ? "bg-gray-400" : "bg-blue-600"
            }`}
          >
            {busy ? "수집 중..." : "네이버 리뷰 수집"}
          </button>
          <button
            onClick={() => router.push("/setup-store")}
            className="px-4 py-3 rounded-lg border text-sm text-gray-700"
          >
            채널 관리
          </button>
        </div>
      </section>
    </div>
  );
}

function OnboardStep({
  title,
  desc,
  status,
  action,
}: {
  title: string;
  desc: string;
  status: "완료" | "진행중" | "대기" | "필요";
  action?: ReactNode;
}) {
  const color =
    status === "완료"
      ? "bg-green-50 text-green-700 border border-green-100"
      : status === "진행중"
      ? "bg-blue-50 text-blue-700 border border-blue-100"
      : status === "필요"
      ? "bg-red-50 text-red-700 border border-red-100"
      : "bg-gray-100 text-gray-700";
  return (
    <div className="rounded-xl border p-3">
      <div className="flex items-center justify-between mb-1">
        <p className="font-semibold text-sm">{title}</p>
        <span className={`text-[11px] px-2 py-1 rounded-full ${color}`}>
          {status}
        </span>
      </div>
      <p className="text-xs text-gray-600 mb-2">{desc}</p>
      {action}
    </div>
  );
}
