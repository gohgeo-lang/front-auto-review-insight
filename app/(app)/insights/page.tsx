"use client";

import { useEffect, useState } from "react";
import useAuthGuard from "@/app/hooks/useAuthGuard";
import { api } from "@/lib/api";

export default function InsightsPage() {
  const { loading: authLoading, user } = useAuthGuard();
  const [insight, setInsight] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    async function load() {
      setLoading(true);
      try {
        const ins = await api.get("/insight").catch(() => null);
        setInsight(ins?.data || null);
      } catch (err) {
        console.error("인사이트 로드 실패", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  if (authLoading || !user) {
    return <div className="p-8 text-center">로딩 중...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-sky-50 pt-[50px] pb-[90px] px-4 space-y-6 animate-fadeIn">
      <section>
        <h1 className="text-2xl font-bold text-gray-900">리뷰 인사이트</h1>
        <p className="text-gray-600 text-sm mt-1">
          대시보드에서 모아온 인사이트 리포트를 자세히 확인하세요.
        </p>
      </section>

      <section className="bg-white border border-gray-100 rounded-xl shadow-xs p-4 space-y-6">
        <InsightSection
          title="핵심 인사이트"
          tags={insight?.keywords || []}
          solutions={
            insight?.core?.comments?.length
              ? insight.core.comments
              : insight?.insightsSummary
              ? [insight.insightsSummary]
              : insight?.insights || []
          }
        />
        <InsightSection
          title="강점"
          tags={insight?.strengths?.keywords || insight?.positives || []}
          solutions={
            insight?.strengths?.comment || insight?.strengths?.solutions?.length
              ? [
                  ...(insight?.strengths?.comment ? [insight.strengths.comment] : []),
                  ...(insight?.strengths?.solutions || []),
                ]
              : insight?.positives || []
          }
        />
        <InsightSection
          title="개선점"
          tags={insight?.improvements?.keywords || insight?.negatives || []}
          solutions={
            insight?.improvements?.comment || insight?.improvements?.solutions?.length
              ? [
                  ...(insight?.improvements?.comment ? [insight.improvements.comment] : []),
                  ...(insight?.improvements?.solutions || []),
                ]
              : insight?.negatives || []
          }
        />
        <InsightSection
          title="트렌드"
          tags={insight?.trendsDetail?.keywords || insight?.trends || []}
          solutions={
            insight?.trendsDetail?.comment || insight?.trendsDetail?.solutions?.length
              ? [
                  ...(insight?.trendsDetail?.comment ? [insight.trendsDetail.comment] : []),
                  ...(insight?.trendsDetail?.solutions || []),
                ]
              : insight?.trends || []
          }
        />
        <InsightSection
          title="최근 리뷰 요약"
          tags={(insight?.tags || insight?.tag || []).slice(0, 5)}
          solutions={insight?.recentSummaries || []}
        />
        <div className="text-sm text-gray-800 leading-relaxed">
          <p className="font-semibold mb-1">매장 설명</p>
          <p>
            {insight?.description ||
              insight?.structured?.shopCharacter ||
              "분석된 데이터가 없습니다."}
          </p>
        </div>
      </section>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-lg font-semibold mb-2">{children}</h2>;
}

function InsightSection({
  title,
  tags,
  solutions,
}: {
  title: string;
  tags: string[];
  solutions: string[];
}) {
  if (!tags?.length && !solutions?.length) {
    return (
      <div className="border border-gray-100 rounded-lg p-4 space-y-2 shadow-xs">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-gray-500">분석된 데이터가 없습니다.</p>
      </div>
    );
  }
  return (
    <div className="border border-gray-100 rounded-lg p-4 space-y-2 shadow-xs">
      <p className="text-sm font-semibold">{title}</p>
      <div className="flex flex-wrap gap-2">
        {(tags || []).slice(0, 10).map((t, i) => (
          <span
            key={`${t}-${i}`}
            className="px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs"
          >
            {t}
          </span>
        ))}
      </div>
      <div className="space-y-1 text-sm text-gray-800">
        {(solutions || []).map((s, i) => (
          <p key={i} className="leading-relaxed">
            • {s}
          </p>
        ))}
      </div>
    </div>
  );
}
