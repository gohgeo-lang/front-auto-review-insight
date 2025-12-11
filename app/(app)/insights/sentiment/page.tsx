"use client";

import { useEffect, useMemo, useState } from "react";
import useAuthGuard from "@/app/hooks/useAuthGuard";
import Link from "next/link";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { usePersistentSWR } from "@/lib/usePersistentSWR";
import { getCache, setCache } from "@/lib/simpleCache";

type ReviewItem = {
  id: string;
  content: string;
  createdAt: string;
  summary?: {
    sentiment?: string;
    positives?: string[];
    negatives?: string[];
    keywords?: string[];
    tags?: string[];
  };
};

export default function SentimentDetailPage() {
  const { loading: authLoading, user } = useAuthGuard();
  const [storeId, setStoreId] = useState<string | null>(null);
  const [range, setRange] = useState("30");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [openDetail, setOpenDetail] = useState<Record<string, boolean>>({});
  const [narrativeLoading, setNarrativeLoading] = useState(true);

  useEffect(() => {
    // 대시보드에서 선택했던 매장 기준으로 정렬
    const saved =
      typeof window !== "undefined"
        ? localStorage.getItem("lastStoreId")
        : null;
    if (saved) setStoreId(saved);
  }, []);

  // 리뷰 데이터: 수집일 기준 우선, 없으면 작성일 기준 폴백
  const { data: collectedReviews, isLoading: loadingCollected } = useSWR<ReviewItem[]>(
    user ? `/reviews${storeId ? `?storeId=${storeId}&collectedToday=true` : `?collectedToday=true`}` : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 5 * 60 * 1000 }
  );
  const { data: fallbackReviews, isLoading: loadingFallback } = useSWR<ReviewItem[]>(
    user && collectedReviews && collectedReviews.length === 0
      ? `/reviews${storeId ? `?storeId=${storeId}` : ""}`
      : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 5 * 60 * 1000 }
  );
  const reviewsRaw = collectedReviews && collectedReviews.length ? collectedReviews : fallbackReviews || [];
  // 배치 스텁(__batch_processed) 제외 + 내용 없는 요약 제거
  const reviews = useMemo(() => {
    const isEmptySummary = (s?: ReviewItem["summary"]) => {
      if (!s) return true;
      const hasSentiment = !!(s.sentiment && s.sentiment.trim());
      const hasLists =
        (s.positives && s.positives.length) ||
        (s.negatives && s.negatives.length) ||
        (s.keywords && s.keywords.length) ||
        (s.tags && s.tags.length);
      return !hasSentiment && !hasLists;
    };
    return (reviewsRaw || []).filter((r) => {
      const tags = r.summary?.tags || [];
      if (tags.includes("__batch_processed")) return false;
      if (isEmptySummary(r.summary)) return false;
      return true;
    });
  }, [reviewsRaw]);
  const loading = loadingCollected || (collectedReviews && collectedReviews.length === 0 && loadingFallback);

  // 대시보드와 동일한 기간 필터
  const rangeFiltered = useMemo(() => {
    // 이미 collectedToday=true로 수집일 기준 필터링되어 있으므로 추가 기간 필터를 적용하지 않음
    return reviews;
  }, [reviews]);

  const normalizeSentiment = (item: ReviewItem) => {
    const raw = (item.summary?.sentiment || "").toLowerCase();
    if (["positive", "negative", "neutral", "irrelevant"].includes(raw))
      return raw;
    const hasNeg = item.summary?.negatives?.length;
    const hasPos = item.summary?.positives?.length;
    if (hasNeg && !hasPos) return "negative";
    if (hasPos && !hasNeg) return "positive";
    if (hasPos && hasNeg) return "neutral";
    return "irrelevant";
  };

  // 12감정 소분류 라벨 추출 (tags에 __sentDetail:* 저장됨)
  const detailLabels: Record<string, string> = {
    joy_contentment: "기쁨·만족",
    excitement: "기대·흥분",
    admiration_awe: "감탄·경외",
    warmth_romance: "호감·따뜻함",
    calm: "편안·차분",
    boredom: "지루함",
    confusion_awkward: "혼란·어색",
    neutral_info: "중립·정보",
    disappointment_sadness: "실망·아쉬움",
    anxiety_fear: "불안·걱정",
    anger_frustration: "분노·좌절",
    disgust_contempt: "혐오·불쾌",
    irrelevant_noise: "기타/무관",
  };
  const getDetailLabel = (item: ReviewItem) => {
    const tagDetail =
      item.summary?.tags
        ?.find((t) => t.startsWith("__sentDetail:"))
        ?.replace("__sentDetail:", "")
        .toLowerCase() || "";
    if (detailLabels[tagDetail]) return tagDetail;
    // fallback: sentiment -> neutral_info/irrelevant_noise
    const main = normalizeSentiment(item);
    if (main === "positive") return "joy_contentment";
    if (main === "negative") return "disappointment_sadness";
    if (main === "neutral") return "neutral_info";
    return "irrelevant_noise";
  };

  const sentimentBuckets = useMemo(() => {
    const grouped: Record<string, ReviewItem[]> = {
      positive: [],
      negative: [],
      neutral: [],
      irrelevant: [],
    };
    rangeFiltered.forEach((r) => {
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
  }, [rangeFiltered]);

  // 키워드 집계: 감정 버킷별로 각각 집계
  const keywordStats = useMemo(() => {
    const addCount = (
      map: Record<string, number>,
      words: string[] | undefined | null
    ) => {
      const unique = Array.from(new Set(words || []));
      unique.forEach((w) => {
        const key = w.trim();
        if (!key) return;
        map[key] = (map[key] || 0) + 1;
      });
    };

    const posMap: Record<string, number> = {};
    const negMap: Record<string, number> = {};
    const neuMap: Record<string, number> = {};
    const irrMap: Record<string, number> = {};

    // 감정 버킷별로 키워드 집계
    sentimentBuckets.positive.forEach((r) =>
      addCount(posMap, r.summary?.keywords)
    );
    sentimentBuckets.negative.forEach((r) =>
      addCount(negMap, r.summary?.keywords)
    );
    sentimentBuckets.neutral.forEach((r) =>
      addCount(neuMap, r.summary?.keywords)
    );
    sentimentBuckets.irrelevant.forEach((r) =>
      addCount(irrMap, r.summary?.keywords)
    );

    const toList = (m: Record<string, number>) =>
      Object.entries(m).sort((a, b) => b[1] - a[1]);

    return {
      positives: toList(posMap),
      negatives: toList(negMap),
      neutral: toList(neuMap),
      irrelevant: toList(irrMap),
    };
  }, [sentimentBuckets]);

  // 소분류(12감정) 집계
  const detailBuckets = useMemo(() => {
    const map: Record<string, ReviewItem[]> = {};
    rangeFiltered.forEach((r) => {
      const key = getDetailLabel(r);
      if (!map[key]) map[key] = [];
      map[key].push(r);
    });
    return map;
  }, [rangeFiltered]);

  // 12감정별 키워드 상위 목록 (중복 제거 후 집계)
  const detailKeywordStats = useMemo(() => {
    const map: Record<string, Record<string, number>> = {};
    rangeFiltered.forEach((r) => {
      const detailKey = getDetailLabel(r);
      if (!map[detailKey]) map[detailKey] = {};
      const seen = new Set<string>();
      (r.summary?.keywords || []).forEach((kw) => {
        const key = kw.trim();
        if (!key || seen.has(key)) return;
        seen.add(key);
        map[detailKey][key] = (map[detailKey][key] || 0) + 1;
      });
    });
    return map;
  }, [rangeFiltered, getDetailLabel]);

  // 요약 코멘트 (300자 이내)
  const sentimentComment = useMemo(() => {
    return "감정 해설을 준비 중입니다.";
  }, []);

  // AI 감정 해설 불러오기
  const { data: insight, isLoading: narrativeLoadingSwr } = usePersistentSWR(
    user ? `/insight${storeId ? `?storeId=${storeId}` : ""}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 5 * 60 * 1000,
      storageKey: user ? `cache:insight:${user.id}:${storeId || "default"}` : undefined,
      ttlMs: 10 * 60 * 1000,
    }
  );
  const narrative = insight?.sentimentNarrative || null;
  useEffect(() => {
    setNarrativeLoading(narrativeLoadingSwr);
  }, [narrativeLoadingSwr]);

  if (authLoading || !user) {
    return <div className="p-8 text-center text-gray-500">불러오는 중...</div>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-sky-50 pt-[50px] pb-[90px] px-4 space-y-4 animate-fadeIn">
        <div className="flex items-center justify-between">
          <div className="h-6 w-40 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="bg-white border border-gray-100 rounded-xl shadow-xs p-4 space-y-3">
          <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
          <div className="h-3 w-full bg-gray-200 rounded animate-pulse" />
          <div className="h-3 w-5/6 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="bg-white border border-gray-100 rounded-xl shadow-xs p-4 space-y-3">
          {[...Array(4)].map((_, idx) => (
            <div key={idx} className="h-10 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="bg-white border border-gray-100 rounded-xl shadow-xs p-4 space-y-2">
          <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
          <div className="h-3 w-full bg-gray-200 rounded animate-pulse" />
          <div className="h-3 w-5/6 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  const getShownCount = (key: string) => {
    const bucket = sentimentBuckets[key] || [];
    return bucket.length;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-sky-50 pt-[50px] pb-[90px] px-4 space-y-6 animate-fadeIn">
      <section className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            감정분포 상세 리포트
          </h1>
        </div>
        <Link href="/dashboard" className="text-xs text-blue-600 underline">
          대시보드로
        </Link>
      </section>

      {/* 안내 카드 */}
      <section className="bg-white border border-gray-100 rounded-xl shadow-xs p-4 space-y-1 text-sm text-gray-700">
        <p className="font-semibold text-gray-900">감정분포 리포트는</p>
        <p>
          고객의 반응을 12가지 유형의 감정으로 분류한 지표입니다. 전체 분위기와
          주요 키워드를 살펴보세요.
        </p>
      </section>

      {/* 12감정 소분류 */}
      <section className="bg-white border border-gray-100 rounded-xl shadow-xs p-4 space-y-3">
        <div className="flex flex-col gap-2 text-sm">
          {/* 합계 카드 */}
          <div className="border border-gray-100 rounded-lg p-3 bg-gray-50 flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-600">전체 합계</p>
              <p className="text-[11px] text-gray-500">
                {Object.values(detailBuckets).reduce(
                  (sum, arr) => sum + (arr?.length || 0),
                  0
                )}
                건
              </p>
            </div>
          </div>
          {/* 12유형 카드 */}
          {Object.keys(detailLabels).map((k) => (
            <div
              key={k}
              className="border border-gray-100 rounded-lg p-3 bg-gray-50 flex flex-col gap-1"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-600">{detailLabels[k]}</p>
                <div className="flex items-center gap-2">
                  <p className="text-[11px] text-gray-500">
                    {detailBuckets[k]?.length || 0}건
                  </p>
                  <button
                    onClick={() =>
                      setOpenDetail((prev) => ({ ...prev, [k]: !prev[k] }))
                    }
                    className="w-5 h-5 flex items-center justify-center text-gray-500 hover:text-gray-700"
                    aria-label={openDetail[k] ? "닫기" : "보기"}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={`w-4 h-4 transition-transform ${
                        openDetail[k] ? "rotate-180" : ""
                      }`}
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </button>
                </div>
              </div>
              {openDetail[k] && (detailBuckets[k]?.length || 0) > 0 && (
                <div className="mt-2 space-y-3">
                  {/* 키워드 배지 */}
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(detailKeywordStats[k] || {})
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 15)
                      .map(([kw, count]) => (
                        <span
                          key={`${k}-kw-${kw}`}
                          className="px-2 py-1 bg-white border border-gray-200 rounded-full text-[11px] text-gray-700"
                        >
                          {kw} ({count})
                        </span>
                      ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 감정 해설 */}
      <section className="bg-white border border-gray-100 rounded-xl shadow-xs p-4 space-y-2">
        <h2 className="text-base font-semibold">감정 해설</h2>
        {narrativeLoading ? (
          <div className="space-y-2">
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
            <div className="h-3 w-full bg-gray-200 rounded animate-pulse" />
            <div className="h-3 w-5/6 bg-gray-200 rounded animate-pulse" />
            <div className="h-3 w-4/6 bg-gray-200 rounded animate-pulse" />
          </div>
        ) : (
          <p className="text-sm text-gray-800 leading-relaxed">
            {narrative || sentimentComment}
          </p>
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
  if (!items?.length) return null;
  return null;
}
