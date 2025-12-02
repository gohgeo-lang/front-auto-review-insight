"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import useAuthGuard from "@/app/hooks/useAuthGuard";
import useAuth from "@/app/hooks/useAuth";
import { useRouter } from "next/navigation";

export default function DummyAdPage() {
  const { user, loading: authLoading } = useAuthGuard();
  const { refresh } = useAuth();
  const router = useRouter();
  const [canClose, setCanClose] = useState(false);
  const [rewarded, setRewarded] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const closeCorner = useMemo<"tl" | "tr" | "bl" | "br">(() => {
    const corners: Array<"tl" | "tr" | "bl" | "br"> = ["tl", "tr", "bl", "br"];
    return corners[Math.floor(Math.random() * corners.length)];
  }, []);

  useEffect(() => {
    // 이미 오늘 수령했다면 바로 안내 후 뒤로가기
    const stored = localStorage.getItem("freeToken:lastExtra");
    if (stored) {
      const last = new Date(stored);
      const now = new Date();
      const kstOffset = 9 * 60 * 60 * 1000;
      const kstNow = new Date(now.getTime() + kstOffset);
      const resetKst = new Date(kstNow);
      resetKst.setHours(9, 0, 0, 0);
      if (kstNow < resetKst) resetKst.setDate(resetKst.getDate() - 1);
      const resetUtc = new Date(resetKst.getTime() - kstOffset);
      if (last >= resetUtc) {
        setMessage("오늘의 광고 보상은 이미 수령했습니다. 내일 9시에 다시 시도하세요.");
        setCanClose(true);
        return;
      }
    }
    let tick = 0;
    const interval = setInterval(() => {
      tick += 100;
      setProgress(Math.min(100, (tick / 5000) * 100));
      if (tick >= 5000) {
        clearInterval(interval);
        setCanClose(true);
        setMessage("리워드가 지급되었습니다.");
        rewardToken();
      }
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const rewardToken = async () => {
    if (rewarded) return;
    try {
      await api.post("/billing/ad-reward");
      setRewarded(true);
      await refresh().catch(() => {});
      localStorage.setItem("freeToken:lastClaimed", new Date().toISOString());
    } catch (err: any) {
      const apiMsg =
        err?.response?.data?.message ||
        (err?.response?.data?.error === "DAILY_LIMIT"
          ? "오늘은 이미 무료 토큰을 받았습니다. 내일 오전 9시에 초기화됩니다."
          : null);
      setMessage(apiMsg || "리워드 지급에 실패했습니다. 다시 시도해주세요.");
    }
  };

  if (authLoading || !user) return <div className="p-6">로딩 중...</div>;

  const cornerClass = {
    tl: "top-4 left-4",
    tr: "top-4 right-4",
    bl: "bottom-16 left-4",
    br: "bottom-16 right-4",
  }[closeCorner];

  return (
    <div className="fixed inset-0 z-[9999] bg-black text-white overflow-hidden">
      <div className="w-full h-full relative flex flex-col">
        <div className="flex-1 bg-gradient-to-br from-blue-900 via-indigo-900 to-black flex items-center justify-center text-center px-6">
          <div className="space-y-2 max-w-xl mx-auto">
            <p className="text-sm text-blue-100">광고 시청</p>
            <h1 className="text-2xl font-bold text-white">더미 광고</h1>
            <p className="text-sm text-blue-100">
              광고가 끝나면 토큰 1개가 지급되고 닫기 버튼이 활성화됩니다.
            </p>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-14 bg-gray-900/95 px-4 flex items-center">
          <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-400 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        {canClose && (
          <div className={`absolute ${cornerClass} flex items-center gap-2`}>
            {message && (
              <span className="h-8 inline-flex items-center px-3 rounded-full bg-white/15 text-xs text-blue-100 border border-white/20 shadow-sm">
                {message}
              </span>
            )}
            <button
              onClick={() => router.back()}
              className="bg-white/15 border border-white/30 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg backdrop-blur-sm transition hover:bg-white/25 text-sm"
              aria-label="광고 닫기"
            >
              ✕
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
