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

      {loading ? (
        <div className="bg-white rounded-xl border shadow-sm p-4 text-sm text-gray-600">
          리포트 불러오는 중...
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-white rounded-xl border shadow-sm p-4 text-sm text-gray-600">
          발행된 리포트가 없습니다.
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <button
              key={r.id}
              onClick={() => router.push(`/reports/${r.id}`)}
              className="w-full text-left bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-2 hover:bg-gray-50"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-800">
                  {labelPeriod(r.period)} 리포트
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
