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

  useEffect(() => {
    if (!user) return;
    async function load() {
      setLoading(true);
      try {
        const rv = await api.get("/reviews");
        setReviews(rv.data || []);
      } catch (err) {
        console.error("리뷰 로드 실패", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  const sentimentBuckets = useMemo(() => {
    const grouped: Record<string, ReviewItem[]> = {
      positive: [],
      negative: [],
      neutral: [],
      irrelevant: [],
    };
    reviews.forEach((r) => {
      const s = r.summary?.sentiment || "irrelevant";
      if (!grouped[s]) grouped[s] = [];
      grouped[s].push(r);
    });
    Object.keys(grouped).forEach((k) => {
      grouped[k] = grouped[k]
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, 10);
    });
    return grouped;
  }, [reviews]);

  if (authLoading || !user) {
    return <div className="p-8 text-center text-gray-500">불러오는 중...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-sky-50 pt-[50px] pb-[90px] px-4 space-y-6 animate-fadeIn">
      <section className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">감성 상세 리포트</h1>
          <p className="text-gray-600 text-sm mt-1">
            긍정/부정/무관 리뷰를 살펴보고 주요 내용을 확인하세요.
          </p>
        </div>
        <Link href="/dashboard" className="text-xs text-blue-600 underline">
          대시보드로
        </Link>
      </section>

      <section className="bg-white border border-gray-100 rounded-xl shadow-xs p-4">
        <h2 className="text-base font-semibold mb-3">감성 분포</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center text-sm">
          {[
            { label: "긍정", key: "positive", color: "text-green-600" },
            { label: "중립", key: "neutral", color: "text-blue-600" },
            { label: "부정", key: "negative", color: "text-orange-600" },
            { label: "기타", key: "irrelevant", color: "text-gray-600" },
          ].map((item) => (
            <div
              key={item.key}
              className="border border-gray-100 rounded-lg p-3 bg-gray-50 flex flex-col items-center"
            >
              <p className={`text-xs ${item.color}`}>{item.label}</p>
              <p className="text-lg font-bold">
                {(sentimentBuckets[item.key] || []).length}
              </p>
            </div>
          ))}
        </div>
      </section>

      {["positive", "neutral", "negative", "irrelevant"].map((type) => (
        <SentimentBlock
          key={type}
          title={
            type === "positive"
              ? "👍 긍정 TOP 10"
              : type === "negative"
              ? "👎 부정 TOP 10"
              : type === "neutral"
              ? "😐 중립 TOP 10"
              : "🚫 무관 리뷰"
          }
          reviews={sentimentBuckets[type] || []}
        />
      ))}
    </div>
  );
}

function SentimentBlock({
  title,
  reviews,
}: {
  title: string;
  reviews: ReviewItem[];
}) {
  return (
    <section className="bg-white border border-gray-100 rounded-xl shadow-xs p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">{title}</h2>
        <span className="text-xs text-gray-500">{reviews.length}건</span>
      </div>
      {reviews.length === 0 ? (
        <p className="text-sm text-gray-500">데이터가 없습니다.</p>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <article key={r.id} className="border border-gray-100 rounded-lg p-3 bg-gray-50">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>{r.summary?.sentiment || "-"}</span>
                <span>{(r.createdAt || "").slice(0, 10)}</span>
              </div>
              <p className="text-sm text-gray-800 whitespace-pre-line mb-2">
                {r.content}
              </p>
              {r.summary?.positives?.length ? (
                <div className="text-xs text-green-600">
                  👍 {r.summary.positives.join(", ")}
                </div>
              ) : null}
              {r.summary?.negatives?.length ? (
                <div className="text-xs text-red-500 mt-1">
                  👎 {r.summary.negatives.join(", ")}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
