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
    <div className="min-h-screen bg-[#fafafa] pt-[50px] pb-[90px] px-4 space-y-6 animate-fadeIn">
      <section>
        <h1 className="text-2xl font-bold">리뷰 인사이트</h1>
        <p className="text-gray-600 text-sm mt-1">
          대시보드에서 모아온 인사이트 리포트를 자세히 확인하세요.
        </p>
      </section>

      <section className="bg-white border rounded-xl shadow-sm p-4">
        <h2 className="text-lg font-semibold mb-3">요약 하이라이트</h2>
        {insight ? (
          <div className="grid grid-cols-1 gap-3 text-sm">
            <InsightList title="💡 인사이트" items={insight.insights || []} />
            <InsightList title="🏷️ 태그" items={insight.tags || insight.tag || []} />
            <InsightList title="🔥 키워드" items={insight.keywords || []} />
          </div>
        ) : (
          <p className="text-gray-500 text-sm">아직 인사이트가 없습니다.</p>
        )}
      </section>

      <section className="bg-white border rounded-xl shadow-sm p-4">
        <p className="text-sm text-gray-600 mb-3">
          대시보드에서 빠르게 본 내용을 이곳에서 자세히 확인할 수 있습니다.
          키워드/감성 상세는 상단 링크를 통해 이동하세요.
        </p>
        <div className="grid grid-cols-1 gap-3 text-sm">
          <InsightList title="💡 인사이트" items={insight?.insights || []} />
          <InsightList title="🏷️ 태그" items={insight?.tags || insight?.tag || []} />
          <InsightList title="🔥 키워드" items={insight?.keywords || []} />
        </div>
      </section>
    </div>
  );
}

function InsightList({ title, items }: { title: string; items: string[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div>
      <p className="font-semibold mb-1">{title}</p>
      <div className="flex flex-wrap gap-2">
        {items.map((t, i) => (
          <span
            key={`${t}-${i}`}
            className="px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs"
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

function Badge({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-semibold ${color}`}
    >
      {label} {value}
    </span>
  );
}
