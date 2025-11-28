"use client";

import { useEffect, useState } from "react";
import useAuthGuard from "@/app/hooks/useAuthGuard";
import { api } from "@/lib/api";
import { notFound, useParams } from "next/navigation";

type Report = {
  id: string;
  period: string;
  rangeDays: number;
  createdAt: string;
  payload: any;
};

const dummyReport: Report = {
  id: "sample-weekly",
  period: "weekly",
  rangeDays: 7,
  createdAt: new Date().toISOString(),
  payload: {
    totalReviews: 42,
    sentimentCounts: { positive: 30, negative: 8, neutral: 4, irrelevant: 0 },
    tags: [
      { label: "친절", count: 12 },
      { label: "청결", count: 9 },
      { label: "맛", count: 7 },
    ],
    keywords: [
      { label: "라떼", count: 6 },
      { label: "디저트", count: 4 },
    ],
  },
};

export default function ReportDetailPage() {
  const { user, loading } = useAuthGuard();
  const params = useParams();
  const reportId = params?.id as string;
  const [report, setReport] = useState<Report | null>(null);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (!user || !reportId) return;
    (async () => {
      setFetching(true);
      try {
        const res = await api.get<Report>(`/reports`, { params: { id: reportId } });
        const data = Array.isArray(res.data) ? res.data[0] : res.data;
        setReport(data || null);
      } catch {
        // fallback to dummy when not found
        if (reportId === "sample-weekly") {
          setReport(dummyReport);
        } else {
          setReport(null);
        }
      } finally {
        setFetching(false);
      }
    })();
  }, [user, reportId]);

  if (loading || fetching) return <div className="p-6">로딩 중...</div>;
  if (!report) return notFound();

  const sentiment = report.payload?.sentimentCounts || {};
  const tags = report.payload?.tags || [];
  const keywords = report.payload?.keywords || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-sky-50 pt-[60px] pb-[90px] px-4 space-y-4 animate-fadeIn">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">
          {report.period === "weekly" ? "주간" : report.period === "monthly" ? "월간" : report.period} 리포트
        </h1>
        <span className="text-xs text-gray-500">{report.createdAt.slice(0, 10)}</span>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-3">
        <div className="text-sm text-gray-700">범위: 최근 {report.rangeDays}일</div>
        <div className="grid grid-cols-2 gap-3 text-sm text-gray-800">
          <div>총 리뷰: {report.payload?.totalReviews ?? "-"}</div>
          <div>긍정: {sentiment.positive ?? 0}</div>
          <div>부정: {sentiment.negative ?? 0}</div>
          <div>중립/기타: {(sentiment.neutral ?? 0) + (sentiment.irrelevant ?? 0)}</div>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-700 mb-1">상위 태그</p>
          <div className="flex flex-wrap gap-2 text-[11px] text-gray-700">
            {tags.length === 0 ? (
              <span className="text-gray-500 text-xs">데이터 없음</span>
            ) : (
              tags.map((t: any, idx: number) => (
                <span key={idx} className="px-2 py-1 rounded-full bg-gray-100 border border-gray-200 text-gray-700">
                  #{t.label} ({t.count})
                </span>
              ))
            )}
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-700 mb-1">상위 키워드</p>
          <div className="flex flex-wrap gap-2 text-[11px] text-gray-700">
            {keywords.length === 0 ? (
              <span className="text-gray-500 text-xs">데이터 없음</span>
            ) : (
              keywords.map((t: any, idx: number) => (
                <span key={idx} className="px-2 py-1 rounded-full bg-gray-100 border border-gray-200 text-gray-700">
                  #{t.label} ({t.count})
                </span>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
