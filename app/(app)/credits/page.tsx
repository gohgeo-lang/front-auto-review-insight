"use client";

import useAuthGuard from "@/app/hooks/useAuthGuard";
import useAuth from "@/app/hooks/useAuth";
import { api } from "@/lib/api";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const packs = [
  { tokens: 10, price: 1000, promoPrice: 1000, label: "10 토큰" },
  { tokens: 30, price: 3000, promoPrice: 2500, label: "30 토큰" },
  { tokens: 50, price: 5000, promoPrice: 4000, label: "50 토큰" },
  { tokens: 100, price: 10000, promoPrice: 7000, label: "100 토큰" },
];

export default function CreditsPage() {
  const { user, loading: authLoading } = useAuthGuard();
  const { refresh } = useAuth();
  const router = useRouter();
  const [loadingPack, setLoadingPack] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [claimedFlag, setClaimedFlag] = useState(false);
  const [claimedExtraFlag, setClaimedExtraFlag] = useState(false);

  // 최초 진입 시 사용자 정보 동기화 (lastFreeTokenAt 포함)
  useEffect(() => {
    refresh().catch(() => {});
  }, [refresh]);

  const claimedToday = useMemo(() => {
    const stored = localStorage.getItem("freeToken:lastClaimed");
    const storedExtra = localStorage.getItem("freeToken:lastExtra");
    const storedDate = stored ? new Date(stored) : null;
    const storedExtraDate = storedExtra ? new Date(storedExtra) : null;
    const last = user?.lastFreeTokenAt ? new Date(user.lastFreeTokenAt) : null;
    const lastExtra = (user as any)?.lastFreeTokenExtraAt
      ? new Date((user as any).lastFreeTokenExtraAt)
      : null;
    const now = new Date();
    const kstOffset = 9 * 60 * 60 * 1000;
    const kstNow = new Date(now.getTime() + kstOffset);
    const resetKst = new Date(kstNow);
    resetKst.setHours(9, 0, 0, 0);
    if (kstNow < resetKst) resetKst.setDate(resetKst.getDate() - 1);
    const resetUtc = new Date(resetKst.getTime() - kstOffset);
    const baseClaimed =
      (last && last >= resetUtc) || (storedDate && storedDate >= resetUtc) || claimedFlag;
    const extraClaimed =
      (lastExtra && lastExtra >= resetUtc) ||
      (storedExtraDate && storedExtraDate >= resetUtc) ||
      claimedExtraFlag;
    return { baseClaimed, extraClaimed };
  }, [user?.lastFreeTokenAt, (user as any)?.lastFreeTokenExtraAt, claimedFlag, claimedExtraFlag]);

  const claimed = claimedToday.baseClaimed && claimedToday.extraClaimed;

  if (authLoading || !user) return <div className="p-6">로딩 중...</div>;

  const buyPack = async (tokens: number) => {
    setLoadingPack(tokens);
    setMessage(null);
    try {
      // 실제 결제 연동 대신 크레딧 추가 API 사용
      const res = await api.post("/billing/credits", { amount: tokens });
      setMessage(`토큰 ${tokens}개가 충전되었습니다. (보유 ${res.data?.extraCredits ?? "-"}개)`);
      await refresh();
    } catch {
      setMessage("충전 실패. 잠시 후 다시 시도하세요.");
    } finally {
      setLoadingPack(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-sky-50 pt-[60px] pb-[90px] px-4 space-y-4 animate-fadeIn">
      <h1 className="text-xl font-bold text-gray-900">토큰 충전</h1>
      <p className="text-sm text-gray-700">
        1토큰 ≈ 1,000원 가치. 인사이트/리포트 1회당 기본 10토큰을 사용합니다.
      </p>

      <div className="grid gap-3">
        {packs.map((p) => (
          <div
            key={p.tokens}
            className="bg-white border border-gray-100 rounded-2xl shadow-xs p-4 flex items-center justify-between"
          >
            <div className="space-y-1">
              <p className="text-sm font-semibold text-gray-900">{p.label}</p>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-600">{p.price.toLocaleString()}원</span>
                {p.promoPrice !== p.price && (
                  <>
                    <span className="text-gray-400 line-through">{p.price.toLocaleString()}원</span>
                    <span className="text-blue-700 font-bold">{p.promoPrice.toLocaleString()}원</span>
                  </>
                )}
              </div>
            </div>
            <button
              onClick={() => buyPack(p.tokens)}
              disabled={loadingPack === p.tokens}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold active:scale-95 disabled:opacity-60"
            >
              {loadingPack === p.tokens ? "충전 중..." : "충전하기"}
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={() => {
          if (claimedToday.baseClaimed && claimedToday.extraClaimed) {
            setMessage("오늘의 무료 토큰은 이미 수령했습니다. 내일 09:00에 다시 시도하세요.");
            return;
          }
          setShowModal(true);
        }}
        className="w-full py-3 rounded-xl bg-gray-100 text-gray-800 text-sm font-semibold active:scale-95"
      >
        무료로 토큰 받기
      </button>
      {message && (
        <p className="text-xs text-gray-600 text-center">{message}</p>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-lg w-11/12 max-w-sm p-4 space-y-3">
            <p className="text-sm font-semibold text-gray-900">토큰 받기</p>
            <p className="text-xs text-gray-600">
              광고 시청 없이 바로 1개를 수령하거나, 광고를 보고 추가로 1개를 더 받으세요.
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={async () => {
                  if (claimedToday.baseClaimed && claimedToday.extraClaimed) {
                    setMessage("무료 토큰은 하루 1회만 수령할 수 있습니다. 내일 오전 9시에 초기화됩니다.");
                    setShowModal(false);
                    return;
                  }
                  setLoadingPack(-1);
                  try {
                    const res = await api.post("/billing/ad-reward");
                    setMessage(`토큰 1개 수령 (보유 ${res.data?.extraCredits ?? "-"}개)`);
                    await refresh();
                    setClaimedFlag(true);
                    localStorage.setItem("freeToken:lastClaimed", new Date().toISOString());
                  } catch (err: any) {
                    const apiMsg =
                      err?.response?.data?.message ||
                      (err?.response?.data?.error === "DAILY_LIMIT"
                        ? "무료 토큰은 하루 1회만 수령할 수 있습니다. 내일 오전 9시에 초기화됩니다."
                        : null);
                    setMessage(apiMsg || "토큰 수령 실패. 잠시 후 다시 시도하세요.");
                    if (err?.response?.data?.error === "DAILY_LIMIT") {
                      setClaimedFlag(true);
                      localStorage.setItem("freeToken:lastClaimed", new Date().toISOString());
                    }
                  } finally {
                    setLoadingPack(null);
                    setShowModal(false);
                  }
                }}
                disabled={loadingPack === -1}
                className="w-full py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold active:scale-95 disabled:opacity-60"
              >
                수령하기 (1개)
              </button>
              <button
                onClick={() => {
                  if (claimedToday.baseClaimed && claimedToday.extraClaimed) {
                    setMessage("무료 토큰은 하루 1회만 수령할 수 있습니다. 내일 오전 9시에 초기화됩니다.");
                    setShowModal(false);
                    return;
                  }
                  if (claimedToday.extraClaimed) {
                    setMessage("광고 보상은 하루 1회만 추가 가능합니다.");
                    setShowModal(false);
                    return;
                  }
                  setClaimedExtraFlag(true);
                  localStorage.setItem("freeToken:lastExtra", new Date().toISOString());
                  setShowModal(false);
                  router.push("/ads/dummy");
                }}
                className="w-full py-2 rounded-lg bg-white border border-gray-200 text-sm text-gray-800 active:scale-95"
              >
                광고 보고 1개 더 받기
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="w-full py-2 rounded-lg bg-gray-100 text-sm text-gray-700 active:scale-95"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
