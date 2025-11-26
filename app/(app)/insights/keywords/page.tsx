"use client";

import { useEffect, useMemo, useState } from "react";
import useAuthGuard from "@/app/hooks/useAuthGuard";
import { api } from "@/lib/api";
import Link from "next/link";

type ReviewItem = {
  id: string;
  content: string;
  createdAt: string;
  summary?: {
    tags?: string[];
    keywords?: string[];
    sentiment?: string;
  };
};

export default function KeywordPage() {
  const { loading: authLoading, user } = useAuthGuard();
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    async function load() {
      setLoading(true);
      try {
        const rv = await api.get("/reviews");
        setReviews(rv.data || []);
      } catch (err) {
        console.error("키워드 로드 실패", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  const keywordCounts = useMemo(() => {
    const map: Record<string, number> = {};
    reviews.forEach((r) => {
      r.summary?.keywords?.forEach((k) => {
        map[k] = (map[k] || 0) + 1;
      });
      r.summary?.tags?.forEach((k) => {
        map[k] = (map[k] || 0) + 1;
      });
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 50);
  }, [reviews]);

  if (authLoading || !user) {
    return <div className="p-8 text-center text-gray-500">불러오는 중...</div>;
  }

  return (
    <div className="min-h-screen bg-[#fafafa] pt-[50px] pb-[90px] px-4 space-y-6 animate-fadeIn">
      <section className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">키워드 상세</h1>
          <p className="text-gray-600 text-sm mt-1">
            리뷰에서 많이 언급된 키워드/태그를 확인하세요.
          </p>
        </div>
        <Link href="/dashboard" className="text-xs text-blue-600 underline">
          대시보드로
        </Link>
      </section>

      <section className="bg-white border rounded-xl shadow-sm p-4">
        <h2 className="text-base font-semibold mb-3">상위 키워드 Top 50</h2>
        {keywordCounts.length === 0 ? (
          <p className="text-sm text-gray-500">
            키워드 데이터가 없습니다. AI 분석을 먼저 실행해 주세요.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {keywordCounts.map(([k, c]) => (
              <span
                key={k}
                className="px-3 py-1 rounded-full bg-gray-100 text-gray-800 text-sm"
              >
                {k} <span className="text-xs text-gray-500">×{c}</span>
              </span>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
