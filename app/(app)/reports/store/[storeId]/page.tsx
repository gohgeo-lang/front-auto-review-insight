"use client";

import { useEffect, useState } from "react";
import useAuthGuard from "@/app/hooks/useAuthGuard";
import { api } from "@/lib/api";
import { useParams, useRouter } from "next/navigation";

type Report = {
  id: string;
  period: string;
  rangeDays: number;
  createdAt: string;
  payload: any;
};

export default function StoreReportsPage() {
  const { user, loading: authLoading } = useAuthGuard();
  const params = useParams();
  const router = useRouter();
  const storeId = params?.storeId as string;
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || !storeId) return;
    (async () => {
      setLoading(true);
      try {
        const res = await api.get<Report[]>("/reports", { params: { storeId } });
        setReports(res.data || []);
      } catch {
        setReports([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [user, storeId]);

  if (authLoading || !user) return <div className="p-6">로딩 중...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-sky-50 pt-[60px] pb-[90px] px-4 space-y-4 animate-fadeIn">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">정기 리포트</h1>
        <button
          onClick={() => router.back()}
          className="text-xs text-blue-600 underline"
        >
          돌아가기
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-sm text-blue-800 shadow-sm">
        <p className="font-semibold">EMILY 팁</p>
        <p className="text-xs text-blue-700 mt-1">
          정기 리포트를 구독하면 주간·월간·분기 리포트를 자동 발행하여 매장 운영 인사이트를 놓치지 않게 도와드려요.
        </p>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm space-y-2 text-sm text-gray-800">
        <p className="text-sm font-semibold text-gray-900">정기 리포트 발급 순서</p>
        <ul className="list-disc list-inside text-xs text-gray-700 space-y-1">
          <li>주간 리포트: 매주 발행 (최근 7일 데이터)</li>
          <li>월간 리포트: 매달 발행 (주간 리포트 기반, 최근 30일)</li>
          <li>분기별 리포트: 분기마다 발행 (월간 리포트 3건 집계)</li>
          <li>연간 리포트: 연 1회 발행 (분기 리포트 4건 집계)</li>
        </ul>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border shadow-sm p-4 text-sm text-gray-600">
          리포트 불러오는 중...
        </div>
      ) : reports.filter((r) => r.period !== "insight").length === 0 ? (
        <div className="bg-white rounded-xl border shadow-sm p-4 text-sm text-gray-600 text-center">
          발행된 정기 리포트가 없습니다.
        </div>
      ) : (
        <div className="space-y-3">
          {reports
            .filter((r) => r.period !== "insight")
            .map((r) => (
            <button
              key={r.id}
              onClick={() => router.push(`/reports/${r.id}`)}
              className="w-full text-left bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-2 hover:bg-gray-50"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-800">
                  {buildReportTitle(r)}
                </p>
                <span className="text-xs text-gray-500">{r.createdAt.slice(0, 10)}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs text-gray-700">
                <div>범위: 최근 {r.rangeDays}일</div>
                <div>총 리뷰: {r.payload?.totalReviews ?? "-"}</div>
              </div>
              <div className="flex flex-wrap gap-2 text-[11px] text-gray-700">
                {(r.payload?.tags || []).slice(0, 6).map((t: any, idx: number) => (
                  <span key={idx} className="px-2 py-1 rounded-full bg-gray-100 border text-gray-700">
                    #{t.label} ({t.count})
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function labelPeriod(p: string) {
  if (p === "weekly") return "주간";
  if (p === "monthly") return "월간";
  if (p === "quarterly") return "분기";
  if (p === "yearly") return "연간";
  return p;
}

function buildReportTitle(r: Report) {
  const created = r.createdAt ? new Date(r.createdAt) : null;
  const y = created ? created.getFullYear() : "";
  const m = created ? created.getMonth() + 1 : "";
  const week = created ? Math.ceil(created.getDate() / 7) : "";

  if (r.period === "weekly") return `${m}월 ${week}주차 리포트`;
  if (r.period === "monthly") return `${m}월 정기 리포트`;
  if (r.period === "quarterly") {
    const q = m ? Math.ceil(Number(m) / 3) : "";
    return `${q}분기 정기 리포트`;
  }
  if (r.period === "yearly") return `${y}년 종합 리포트`;
  return `${labelPeriod(r.period)} 리포트`;
}
