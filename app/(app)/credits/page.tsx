"use client";

import useAuthGuard from "@/app/hooks/useAuthGuard";
import useAuth from "@/app/hooks/useAuth";
import { api } from "@/lib/api";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const packs = [
  { tokens: 1, price: 3000, original: 3000, label: "이용권 1개" },
  { tokens: 5, price: 10000, original: 15000, label: "이용권 5개" }, // 약 33% 할인
  { tokens: 10, price: 15000, original: 30000, label: "이용권 10개" }, // 약 50% 할인
];

export default function CreditsPage() {
  const { user, loading: authLoading } = useAuthGuard();
  const { refresh } = useAuth();
  const router = useRouter();
  const search = useSearchParams();
  const [loadingPack, setLoadingPack] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [payStatus, setPayStatus] = useState<string | null>(null);

  useEffect(() => {
    refresh().catch(() => {});
  }, [refresh]);

  if (authLoading || !user) return <div className="p-6">로딩 중...</div>;

  const buyPack = async (tokens: number) => {
    setLoadingPack(tokens);
    setMessage(null);
    setShowPayModal(true);
    setPayStatus("결제 처리 중입니다...");
    try {
      const res = await api.post("/billing/credits", { amount: tokens });
      setPayStatus("결제가 완료되었습니다. 3초 후 이전 화면으로 돌아갑니다.");
      await refresh();
      setTimeout(() => {
        setShowPayModal(false);
        // start/flow로 되돌아가서 이용권 모달을 다시 띄우기 위한 플래그
        localStorage.setItem("resumeTokenModal", "true");
        localStorage.setItem("resumeStep", "2");
        const returnTo = search?.get("returnTo");
        if (returnTo) {
          router.push(`/${returnTo}`);
        } else {
          router.back();
        }
      }, 3000);
      setMessage(`이용권 ${tokens}개가 충전되었습니다. (보유 ${res.data?.extraCredits ?? "-"}개)`);
    } catch {
      setPayStatus("결제에 실패했습니다. 다시 시도해주세요.");
      setMessage("충전 실패. 잠시 후 다시 시도하세요.");
      setTimeout(() => setShowPayModal(false), 2000);
    } finally {
      setLoadingPack(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-sky-50 pt-[60px] pb-[90px] px-4 space-y-4 animate-fadeIn">
      <h1 className="text-xl font-bold text-gray-900">이용권 구매</h1>
      <p className="text-sm text-gray-700">필요한 이용권 묶음을 선택해 결제하세요.</p>

      <div className="grid gap-3">
        {packs.map((p) => (
          <div
            key={p.tokens}
            className="bg-white border border-gray-100 rounded-2xl shadow-xs p-4 flex items-center justify-between"
          >
            <div className="space-y-1">
              <p className="text-sm font-semibold text-gray-900">{p.label}</p>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="text-base font-bold text-gray-900">{p.price.toLocaleString()}원</span>
                {p.original > p.price && (
                  <>
                    <span className="text-xs line-through text-gray-400">
                      {p.original.toLocaleString()}원
                    </span>
                    <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                      약 {Math.round(((p.original - p.price) / p.original) * 100)}% 할인
                    </span>
                  </>
                )}
              </div>
              {p.original > p.price && (
                <p className="text-[11px] text-gray-500">
                  개당 {(p.price / p.tokens).toLocaleString()}원 (기존 {(p.original / p.tokens).toLocaleString()}원)
                </p>
              )}
            </div>
            <button
              onClick={() => buyPack(p.tokens)}
              disabled={loadingPack === p.tokens}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold active:scale-95 disabled:opacity-60"
            >
              {loadingPack === p.tokens ? "충전 중..." : "구매하기"}
            </button>
          </div>
        ))}
      </div>

      {showPayModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-lg w-11/12 max-w-sm p-4 space-y-3 text-center">
            <h3 className="text-lg font-semibold text-gray-900">결제 진행 중</h3>
            <p className="text-sm text-gray-700">{payStatus || "잠시만 기다려주세요..."}</p>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 animate-pulse" />
            </div>
          </div>
        </div>
      )}

      {message && <p className="text-xs text-gray-600 text-center">{message}</p>}
    </div>
  );
}
