"use client";

import { useEffect, useMemo, useState } from "react";
import useAuthGuard from "@/app/hooks/useAuthGuard";
import { api } from "@/lib/api";
import Link from "next/link";
import { getCache, setCache } from "@/lib/simpleCache";

export default function KeywordPage() {
  const { loading: authLoading, user } = useAuthGuard();
  const [insight, setInsight] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [sectionLoading, setSectionLoading] = useState({
    keywords: true,
    categories: true,
    solutions: true,
  });

  useEffect(() => {
    if (!user) return;
    const cacheKey = "insight:default";
    const cached = getCache<any>(cacheKey);
    if (cached) {
      setInsight(cached);
      setSectionLoading({ keywords: false, categories: false, solutions: false });
    }
    async function load() {
      setLoading(true);
      try {
        const res = await api.get("/insight");
        if (res?.data) {
          setInsight(res.data);
          setCache(cacheKey, res.data);
        } else {
          setInsight(null);
        }
        setSectionLoading({ keywords: false, categories: false, solutions: false });
      } catch (err) {
        console.error("키워드 로드 실패", err);
        setInsight(null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  const keywordCounts: [string, number][] = useMemo(() => {
    if (insight?.keywordsTop50?.length) {
      return insight.keywordsTop50.map((k: any) => [k.keyword || k, k.count ?? k.freq ?? 0]);
    }
    if (insight?.keywords?.length) {
      return insight.keywords.map((k: any) =>
        Array.isArray(k) ? [k[0], k[1] ?? 0] : [k, 0]
      );
    }
    return [];
  }, [insight]);

  const categorized = useMemo(() => {
    return insight?.autoCategories || [];
  }, [insight]);

  const solutions = useMemo(() => {
    if (insight?.keywordSolutions?.length) return insight.keywordSolutions;
    if (insight?.solutions?.length) return insight.solutions;
    return [];
  }, [insight]);

  if (authLoading || !user) {
    return <div className="p-8 text-center text-gray-500">불러오는 중...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-sky-50 pt-[50px] pb-[90px] px-4 space-y-6 animate-fadeIn">
      <section className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">키워드 상세</h1>
          <p className="text-gray-600 text-sm mt-1">
            리뷰에서 많이 언급된 키워드/태그를 확인하세요.
          </p>
        </div>
        <Link href="/dashboard" className="text-xs text-blue-600 underline">
          대시보드로
        </Link>
      </section>

      <section className="bg-white border border-gray-100 rounded-xl shadow-xs p-4">
        <h2 className="text-base font-semibold mb-3">상위 키워드 Top 50</h2>
        {sectionLoading.keywords ? (
          <div className="flex flex-wrap gap-2">
            {[...Array(15)].map((_, idx) => (
              <div key={idx} className="h-7 w-16 bg-gray-200 rounded-full animate-pulse" />
            ))}
          </div>
        ) : keywordCounts.length ? (
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
        ) : (
          <p className="text-xs text-gray-500">데이터가 없습니다.</p>
        )}
      </section>

      <section className="bg-white border border-gray-100 rounded-xl shadow-xs p-4 space-y-3">
        <h2 className="text-base font-semibold">자동 카테고리</h2>
        {sectionLoading.categories ? (
          <div className="grid md:grid-cols-2 gap-2">
            {[...Array(4)].map((_, idx) => (
              <div key={idx} className="h-10 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : categorized.length ? (
          <div className="grid md:grid-cols-2 gap-2 text-sm text-gray-800">
            {categorized.map((c: any) => (
              <div
                key={c.category}
                className="flex items-center justify-between border border-gray-100 rounded-lg px-3 py-2 bg-gray-50"
              >
                <span>{c.category}</span>
                <span className="text-xs text-gray-500">
                  {(c.keywords || []).slice(0, 5).join(", ")}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-500">데이터가 없습니다.</p>
        )}
      </section>

      <section className="bg-white border border-gray-100 rounded-xl shadow-xs p-4 space-y-2">
        <h2 className="text-base font-semibold">추천 솔루션</h2>
        {sectionLoading.solutions ? (
          <div className="space-y-2">
            {[...Array(4)].map((_, idx) => (
              <div key={idx} className="h-3 w-full bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        ) : (
          <ul className="text-sm text-gray-800 list-disc list-inside space-y-1">
            {solutions.length ? (
              solutions.map((s: string, i: number) => <li key={i}>{s}</li>)
            ) : (
              <li className="text-xs text-gray-500">데이터가 없습니다.</li>
            )}
          </ul>
        )}
      </section>
    </div>
  );
}

function KeywordBlock({
  title,
  items,
}: {
  title: string;
  items: [string, number][];
}) {
  return (
    <div className="border rounded-lg p-3 bg-gray-50">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-semibold">{title}</p>
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-gray-500">데이터 없음</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {items.slice(0, 20).map(([k, c]) => (
            <span
              key={k}
              className="px-3 py-1 rounded-full bg-white border text-sm text-gray-800"
            >
              {k} <span className="text-xs text-gray-500">×{c}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
