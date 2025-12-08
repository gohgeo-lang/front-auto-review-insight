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
    sentiment?: string;
    positives?: string[];
    negatives?: string[];
    keywords?: string[];
    tags?: string[];
  };
};

export default function SentimentDetailPage() {
  const { loading: authLoading, user } = useAuthGuard();
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [range, setRange] = useState("30");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [openDetail, setOpenDetail] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // 대시보드에서 선택했던 매장 기준으로 정렬
    const saved =
      typeof window !== "undefined"
        ? localStorage.getItem("lastStoreId")
        : null;
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

  // 대시보드와 동일한 기간 필터
  const rangeFiltered = useMemo(() => {
    return reviews.filter((r: any) => {
      const created = new Date(r.createdAt);

      if (customFrom || customTo) {
        const from = customFrom ? new Date(customFrom) : new Date("1970-01-01");
        const to = customTo ? new Date(customTo) : new Date();
        const diffDays = (to.getTime() - from.getTime()) / (1000 * 3600 * 24);
        if (diffDays > 366) return false; // 1년 제한
        return created >= from && created <= to;
      }

      if (range === "today") {
        const today = new Date().toISOString().slice(0, 10);
        return created.toISOString().slice(0, 10) === today;
      }

      const days = Number(range);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      return created >= cutoff;
    });
  }, [reviews, customFrom, customTo, range]);

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
      (words || []).forEach((w) => {
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

  // 요약 코멘트 (300자 이내)
  const sentimentComment = useMemo(() => {
    const total = Object.values(detailBuckets).reduce(
      (sum, arr) => sum + (arr?.length || 0),
      0
    );
    if (!total) return "아직 감정 데이터가 없습니다.";

    const entries = Object.entries(detailBuckets)
      .map(([k, arr]) => ({
        key: k,
        label: detailLabels[k] || k,
        count: arr?.length || 0,
      }))
      .filter((e) => e.count > 0)
      .sort((a, b) => b.count - a.count);

    const top = entries
      .slice(0, 3)
      .map((e) => `${e.label}(${e.count}건)`)
      .join(", ");

    const pos = sentimentBuckets.positive.length;
    const neg = sentimentBuckets.negative.length;
    const neu = sentimentBuckets.neutral.length;
    const irr = sentimentBuckets.irrelevant.length;

    const mainTone =
      pos > neg
        ? "전반적으로 긍정적인 감정이 더 많이 나타납니다."
        : neg > pos
        ? "부정적인 감정 언급이 상대적으로 많습니다."
        : "긍정과 부정이 비슷하게 언급됩니다.";

    const highlight = top ? `주요 감정: ${top}` : "주요 감정을 파악할 데이터가 부족합니다.";
    const text = `${mainTone} ${highlight}`;
    return text.length > 300 ? text.slice(0, 300) : text;
  }, [detailBuckets, sentimentBuckets]);

  if (authLoading || !user) {
    return <div className="p-8 text-center text-gray-500">불러오는 중...</div>;
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
                    {(detailBuckets[k] || [])
                      .flatMap((r) => r.summary?.keywords || [])
                      .filter(Boolean)
                      .slice(0, 15)
                      .map((kw, idx) => (
                        <span
                          key={`${k}-kw-${idx}-${kw}`}
                          className="px-2 py-1 bg-white border border-gray-200 rounded-full text-[11px] text-gray-700"
                        >
                          {kw}
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
        <h2 className="text-base font-semibold">감정 요약</h2>
        <p className="text-sm text-gray-800 leading-relaxed">
          {sentimentComment}
        </p>
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
