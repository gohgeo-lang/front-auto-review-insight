"use client";

import { useEffect, useMemo, useState } from "react";
import useAuthGuard from "@/app/hooks/useAuthGuard";
import { api } from "@/lib/api";
import Link from "next/link";

type ReviewItem = {
  id: string;
  content: string;
  createdAt: string;
  summary?: { sentiment?: string; positives?: string[]; negatives?: string[] };
};

export default function SentimentDetailPage() {
  const { loading: authLoading, user } = useAuthGuard();
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [storeId, setStoreId] = useState<string | null>(null);

  useEffect(() => {
    // 대시보드에서 선택했던 매장 기준으로 정렬
    const saved = typeof window !== "undefined" ? localStorage.getItem("lastStoreId") : null;
    if (saved) setStoreId(saved);
  }, []);

  useEffect(() => {
    if (!user) return;
    async function load() {
      setLoading(true);
      try {
        const rv = await api.get("/reviews", {
          params: storeId ? { storeId } : {},
        });
        setReviews(rv.data || []);
      } catch (err) {
        console.error("리뷰 로드 실패", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user, storeId]);

  const normalizeSentiment = (item: ReviewItem) => {
    const raw = (item.summary?.sentiment || "").toLowerCase();
    if (["positive", "negative", "neutral", "irrelevant"].includes(raw)) return raw;
    const hasNeg = item.summary?.negatives?.length;
    const hasPos = item.summary?.positives?.length;
    if (hasNeg && !hasPos) return "negative";
    if (hasPos && !hasNeg) return "positive";
    if (hasPos && hasNeg) return "neutral";
    return "irrelevant";
  };

  const sentimentBuckets = useMemo(() => {
    const grouped: Record<string, ReviewItem[]> = {
      positive: [],
      negative: [],
      neutral: [],
      irrelevant: [],
    };
    reviews.forEach((r) => {
      const s = normalizeSentiment(r);
      if (!grouped[s]) grouped[s] = [];
      grouped[s].push(r);
    });
    Object.keys(grouped).forEach((k) => {
      grouped[k] = grouped[k].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    });
    return grouped;
  }, [reviews]);

  // 키워드 집계: 긍정/부정 버킷 기준으로 따로 집계
  const keywordStats = useMemo(() => {
    const addCount = (
      map: Record<string, number>,
      words: string[] | undefined | null
    ) => {
      (words || []).forEach((w) => {
        const key = w.trim();
        if (!key) return;
        map[key] = (map[key] || 0) + 1;
      });
    };

    const posMap: Record<string, number> = {};
    const negMap: Record<string, number> = {};

    // 모든 리뷰의 긍정/부정 키워드를 각각 집계(감성 버킷과 무관)
    reviews.forEach((r) => {
      addCount(posMap, r.summary?.positives);
      addCount(negMap, r.summary?.negatives);
    });

    const toList = (m: Record<string, number>) =>
      Object.entries(m).sort((a, b) => b[1] - a[1]);

    return {
      positives: toList(posMap),
      negatives: toList(negMap),
    };
  }, [sentimentBuckets]);

  if (authLoading || !user) {
    return <div className="p-8 text-center text-gray-500">불러오는 중...</div>;
  }

  const getShownCount = (key: string) => {
    if (key === "positive") return (keywordStats.positives || []).slice(0, 5).length || 0;
    if (key === "negative") return (keywordStats.negatives || []).slice(0, 5).length || 0;
    return 0;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-sky-50 pt-[50px] pb-[90px] px-4 space-y-6 animate-fadeIn">
      <section className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">감정분포 상세 리포트</h1>
          <p className="text-gray-600 text-sm mt-1">
            긍정/부정/무관 리뷰를 살펴보고 주요 내용을 확인하세요.
          </p>
        </div>
        <Link href="/dashboard" className="text-xs text-blue-600 underline">
          대시보드로
        </Link>
      </section>

      <section className="bg-white border border-gray-100 rounded-xl shadow-xs p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center text-sm">
          {[
            {
              label: "긍정",
              key: "positive",
              color: "text-green-600",
              shownCount: getShownCount("positive"),
            },
            {
              label: "중립",
              key: "neutral",
              color: "text-blue-600",
              shownCount: getShownCount("neutral"),
            },
            {
              label: "부정",
              key: "negative",
              color: "text-orange-600",
              shownCount: getShownCount("negative"),
            },
            {
              label: "기타",
              key: "irrelevant",
              color: "text-gray-600",
              shownCount: getShownCount("irrelevant"),
            },
          ].map((item) => (
            <div
              key={item.key}
              className="border border-gray-100 rounded-lg p-3 bg-gray-50 flex flex-col items-center"
            >
              <p className={`text-xs ${item.color}`}>{item.label}</p>
              <p className="text-lg font-bold">{item.shownCount}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white border border-gray-100 rounded-xl shadow-xs p-4 space-y-4">
        <div className="grid grid-cols-1 gap-3 text-sm">
          {[
            {
              key: "positive",
              title: "👍 긍정",
              color: "text-green-600",
              explanation: "친절·청결·맛 같은 강점이 꾸준히 언급됩니다.",
              solution: "강점 키워드를 계속 노출하고, 시그니처를 중심으로 프로모션을 설계하세요.",
              keywords: keywordStats.positives,
            },
            {
              key: "negative",
              title: "👎 부정",
              color: "text-red-600",
              explanation: "가격·대기·응대 속도 같은 불만이 반복됩니다.",
              solution: "반복 키워드를 우선 개선하고, 안내 문구나 알림으로 기대치를 맞춰 주세요.",
              keywords: keywordStats.negatives,
            },
            {
              key: "neutral",
              title: "😐 중립",
              color: "text-blue-600",
              explanation: "정보성 언급이나 단순 평가가 많습니다.",
              solution: "설명·안내를 보강해 긍정 경험으로 전환할 포인트를 만들어 주세요.",
              keywords: [],
            },
            {
              key: "irrelevant",
              title: "🚫 기타",
              color: "text-gray-600",
              explanation: "매장과 무관한 내용입니다.",
              solution: "모니터링만 유지하고 핵심 피드백에 집중하세요.",
              keywords: [],
            },
          ].map((item) => (
            <div
              key={item.key}
              className="border border-gray-100 rounded-lg p-4 bg-gray-50 space-y-3"
            >
              {(() => {
                const shown = (item.keywords || []).slice(0, 5);
                const count = getShownCount(item.key);
                return (
                  <>
                  <div className="flex items-center justify-between">
                    <p className={`text-sm font-semibold ${item.color}`}>{item.title}</p>
                    <span className="text-xs text-gray-500">{count}건</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {shown.length ? (
                      shown.map(([word, cnt]) => (
                        <span
                          key={word}
                          className="px-2 py-1 rounded-full bg-white text-gray-800 text-xs border border-gray-200 flex items-center gap-1"
                        >
                          {word} <span className="text-[10px] text-gray-500">×{cnt}</span>
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-gray-500">키워드 데이터가 없습니다.</span>
                )}
                  </div>
                  <div className="border-t border-gray-200 pt-2 space-y-1 text-xs text-gray-700">
                    <p>코멘트: {item.explanation} {item.solution}</p>
                  </div>
                  </>
                );
              })()}
            </div>
          ))}
        </div>
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
  if (!items?.length) return null;
  return null;
}
