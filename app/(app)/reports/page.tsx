"use client";

import { useEffect, useState } from "react";
import useAuthGuard from "@/app/hooks/useAuthGuard";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";

type Store = {
  id: string;
  name?: string | null;
  naverPlaceId?: string | null;
  googlePlaceId?: string | null;
  kakaoPlaceId?: string | null;
  autoReportEnabled?: boolean | null;
};
type Report = {
  id: string;
  period: string;
  rangeDays: number;
  createdAt: string;
  payload: any;
};

const dummyAds = "정기 리포트로 고객 반응을 한눈에 확인하세요. 무료 1회 체험 후, 주기 발행!";
const dummyTips = "피크타임 불만 키워드를 먼저 개선하고, 긍정 키워드는 직원 교육/메뉴 전략에 반영해 보세요.";

export default function ReportsPage() {
  const { user, loading: authLoading } = useAuthGuard();
  const router = useRouter();
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState<string | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const res = await api.get("/store");
        const list: Store[] = res.data || [];
        setStores(list);
        setSelectedStore((prev) => prev || list[0]?.id || null);
      } catch {
        setStores([]);
      }
    })();
  }, [user]);

  useEffect(() => {
    if (!user || !selectedStore) return;
    (async () => {
      setLoading(true);
      try {
        const res = await api.get<Report[]>("/reports", { params: { storeId: selectedStore } });
        setReports(res.data || []);
      } catch {
        setReports([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [user, selectedStore]);

  if (authLoading || !user) return <div className="p-6">로딩 중...</div>;
  const isSubActive = (user as any)?.subscriptionStatus === "active";
  const subscribedStores = stores.filter((s) => s.autoReportEnabled);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-sky-50 pt-[60px] pb-[90px] px-4 space-y-4 animate-fadeIn">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">정기 리포트</h1>
      </div>

      {/* 광고/배너 (더미) */}
      <div className="bg-gradient-to-r from-sky-500 to-indigo-500 text-white rounded-2xl p-4 shadow-sm">
        <p className="text-xs uppercase font-semibold mb-1">Ad / Banner</p>
        <h3 className="text-lg font-bold">자동 리포트, 접속 없이 받아보기</h3>
        <p className="text-sm text-blue-50 mt-1">{dummyAds}</p>
      </div>

      {/* 팁 (더미) */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 space-y-2">
        <p className="text-sm font-semibold text-gray-800">리포트 활용 팁</p>
        <p className="text-xs text-gray-600">{dummyTips}</p>
      </div>

      {/* 매장 카드 리스트 */}
      <div className="space-y-2">
        <p className="text-sm font-semibold text-gray-800">내 매장</p>
        {!isSubActive ? (
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 text-center space-y-3">
            <p className="text-sm text-gray-700">구독 중인 매장이 없습니다.</p>
            <button
              onClick={() => router.push("/subscribe")}
              className="w-full py-3 rounded-xl bg-blue-600 text-white text-sm font-semibold active:scale-95"
            >
              매장 정기 구독하기
            </button>
          </div>
        ) : subscribedStores.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 text-center space-y-3">
            <p className="text-sm text-gray-700">구독 중인 매장이 없습니다.</p>
            <button
              onClick={() => router.push("/subscribe")}
              className="w-full py-3 rounded-xl bg-blue-600 text-white text-sm font-semibold active:scale-95"
            >
              매장 정기 구독하기
            </button>
          </div>
        ) : (
          <>
            <div className="grid gap-2">
              {subscribedStores.map((s) => (
                <button
                  key={s.id}
                  onClick={() => router.push(`/reports/store/${s.id}`)}
                  className={`w-full text-left border rounded-2xl p-3 shadow-sm ${
                    s.id === selectedStore
                      ? "bg-blue-50 border-blue-200"
                      : "bg-white border-gray-200"
                  }`}
                >
                  <p className="text-sm font-semibold text-gray-900">{s.name || "매장"}</p>
                  <p className="text-xs text-gray-600 mt-1">
                    연결된 플랫폼:{" "}
                    {[
                      s.naverPlaceId || (s as any).placeId ? "네이버" : null,
                      s.googlePlaceId ? "구글" : null,
                      s.kakaoPlaceId ? "카카오" : null,
                    ]
                      .filter(Boolean)
                      .join(" / ") || "없음"}
                  </p>
                </button>
              ))}
            </div>
            <button
              onClick={() => router.push("/plans")}
              className="w-full py-2 rounded-xl bg-gray-100 text-gray-800 text-sm active:scale-95"
            >
              다른 매장 구독하기
            </button>
          </>
        )}
      </div>

      {message && <div className="text-xs text-gray-600">{message}</div>}
    </div>
  );
}

function labelPeriod(p: string) {
  return "리포트";
}
