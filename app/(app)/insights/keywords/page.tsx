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

type Category = "친절/서비스" | "대기/속도" | "가격/가성비" | "청결/위생" | "기타";
const CATEGORY_KEYWORDS: Record<Category, string[]> = {
  "친절/서비스": ["친절", "응대", "서비스", "직원", "사장님"],
  "대기/속도": ["대기", "기다림", "속도", "빠름", "느림"],
  "가격/가성비": ["가격", "가성비", "비싸", "저렴", "합리적"],
  "청결/위생": ["청결", "위생", "깨끗", "정돈", "정리"],
  기타: [],
};
const SAMPLE_REVIEWS: ReviewItem[] = [
  {
    id: "sample1",
    content: "친절하고 커피가 맛있어요. 시그니처 메뉴 최고!",
    createdAt: new Date().toISOString(),
    summary: {
      keywords: ["친절", "커피 맛", "시그니처"],
      tags: ["청결", "분위기"],
      sentiment: "positive",
    },
  },
  {
    id: "sample2",
    content: "대기시간이 길었지만 직원 응대는 좋았습니다.",
    createdAt: new Date().toISOString(),
    summary: {
      keywords: ["대기시간", "응대"],
      tags: ["가격", "대기"],
      sentiment: "negative",
    },
  },
];

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
        const data = rv.data || [];
        setReviews(data.length ? data : SAMPLE_REVIEWS);
      } catch (err) {
        console.error("키워드 로드 실패", err);
        setReviews(SAMPLE_REVIEWS);
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
  const displayKeywords =
    keywordCounts.length > 0
      ? keywordCounts
      : [
          ["친절", 5],
          ["청결", 4],
          ["커피 맛", 4],
          ["대기시간", 3],
          ["가격", 3],
        ];

  const sentimentKeyword = useMemo(() => {
    const pos: Record<string, number> = {};
    const neg: Record<string, number> = {};
    reviews.forEach((r) => {
      const sentiment = r.summary?.sentiment || "irrelevant";
      const kws = [...(r.summary?.keywords || []), ...(r.summary?.tags || [])];
      kws.forEach((k) => {
        if (sentiment === "negative") neg[k] = (neg[k] || 0) + 1;
        else pos[k] = (pos[k] || 0) + 1;
      });
    });
    const top = (obj: Record<string, number>, n = 20) =>
      Object.entries(obj).sort((a, b) => b[1] - a[1]).slice(0, n);
    return {
      positive: top(pos, 20),
      negative: top(neg, 20),
    };
  }, [reviews]);

  const categorized = useMemo(() => {
    const buckets: Record<Category, number> = {
      "친절/서비스": 0,
      "대기/속도": 0,
      "가격/가성비": 0,
      "청결/위생": 0,
      기타: 0,
    };
    (keywordCounts.length ? keywordCounts : displayKeywords).forEach(([k, c]) => {
      const cat = (Object.keys(CATEGORY_KEYWORDS) as Category[]).find((cat) =>
        CATEGORY_KEYWORDS[cat].some((kw) => k.includes(kw))
      );
      if (cat) buckets[cat] += c;
      else buckets["기타"] += c;
    });
    return buckets;
  }, [keywordCounts]);

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
        <div className="flex flex-wrap gap-2">
          {(keywordCounts.length ? keywordCounts : displayKeywords).map(([k, c]) => (
            <span
              key={k}
              className="px-3 py-1 rounded-full bg-gray-100 text-gray-800 text-sm"
            >
              {k} <span className="text-xs text-gray-500">×{c}</span>
            </span>
          ))}
        </div>
      </section>

      <section className="bg-white border border-gray-100 rounded-xl shadow-xs p-4 space-y-3">
        <h2 className="text-base font-semibold">자동 카테고리</h2>
        <div className="grid md:grid-cols-2 gap-2 text-sm text-gray-800">
          {Object.entries(categorized).map(([cat, count]) => (
            <div key={cat} className="flex items-center justify-between border border-gray-100 rounded-lg px-3 py-2 bg-gray-50">
              <span>{cat}</span>
              <span className="font-semibold">{count}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white border border-gray-100 rounded-xl shadow-xs p-4 space-y-2">
        <h2 className="text-base font-semibold">추천 솔루션</h2>
        <ul className="text-sm text-gray-800 list-disc list-inside space-y-1">
          <li>상위 키워드(예: {displayKeywords.slice(0, 3).map(([k]) => k).join(", ")})를 프로모션/게시글에 반영해 고객이 많이 찾는 포인트를 강조하세요.</li>
          <li>부정 맥락이 있는 키워드(가격/대기 등)는 FAQ, 안내문구, 현장 프로세스로 선제 대응하세요.</li>
          <li>카테고리별 언급량을 모니터링해 친절/대기/가격/청결 개선 액션을 우선순위화하세요.</li>
        </ul>
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
