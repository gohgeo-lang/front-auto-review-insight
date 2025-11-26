"use client";

import { useEffect, useState } from "react";
import useAuthGuard from "@/app/hooks/useAuthGuard";
import { api } from "@/lib/api";
import RatingChart from "@/components/RatingChart";
import Link from "next/link";

export default function Dashboard() {
  // 로그인 보호 (로그인 안 되어 있으면 자동 redirect)
  const { loading: authLoading, user } = useAuthGuard();

  const [reviews, setReviews] = useState([]);
  const [insight, setInsight] = useState<any>(null);
  const [range, setRange] = useState("30"); // days filter default 1개월
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  // =============================
  // 1) 데이터 로딩
  // =============================
  useEffect(() => {
    if (!user) return; // 로그인 보호

    async function load() {
      try {
        // 리뷰 전체 불러오기
        const rv = await api.get("/reviews");
        setReviews(rv.data);

        // 사용자 인사이트 불러오기
        const ins = await api.get(`/insight`).catch(() => null);
        setInsight(ins?.data || null);
      } catch (err) {
        console.error("리뷰 로딩 실패:", err);
      }
    }

    load();
  }, [user]);

  // AuthContext 로딩 중에는 깜빡임 방지
  if (authLoading || !user) {
    return <div className="p-8 text-center">로딩 중...</div>;
  }

  // =============================
  // 2) 기간 필터 적용
  // =============================
  const rangeFiltered = reviews.filter((r: any) => {
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

  // =============================
  // 4) 긍정/부정 차트 데이터 생성 (요약 기반)
  // =============================
  function getChartData() {
    const map: Record<
      string,
      {
        positive: number;
        negative: number;
        neutral: number;
        irrelevant: number;
      }
    > = {};
    rangeFiltered.forEach((r: any) => {
      const day = r.createdAt.split("T")[0];
      if (!map[day])
        map[day] = { positive: 0, negative: 0, neutral: 0, irrelevant: 0 };
      const sentiment = r.summary?.sentiment || "irrelevant";
      if (sentiment === "positive") map[day].positive += 1;
      else if (sentiment === "negative") map[day].negative += 1;
      else if (sentiment === "neutral") map[day].neutral += 1;
      else map[day].irrelevant += 1;
    });

    return Object.keys(map)
      .sort()
      .map((d) => ({
        date: d,
        positive: map[d].positive,
        negative: map[d].negative,
        neutral: map[d].neutral,
        irrelevant: map[d].irrelevant,
      }));
  }

  const chartData = getChartData();
  const insightItems = [
    ...(insight?.insights || []),
    ...(insight?.positives || insight?.positive || []),
    ...(insight?.negatives || insight?.negative || []),
    ...(insight?.keywords || []),
  ].filter(Boolean);
  const hasInsight = insightItems.length > 0;

  // =============================
  // 5) 렌더링
  // =============================
  return (
    <div className="min-h-screen bg-[#fafafa] pt-[50px] pb-[90px] px-4 space-y-6 animate-fadeIn">
      {/* ===================== */}
      {/* 1) 타이틀 */}
      {/* ===================== */}
      <section>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">대시보드</h1>
            <p className="text-gray-600 text-sm mt-1">
              고객들의 반응을 분석한 흐름과 키워드를 한눈에 확인하세요.
            </p>
          </div>
        </div>
      </section>

      {/* ===================== */}
      {/* 2) AI 인사이트 */}
      {/* ===================== */}
      <section>
        {hasInsight ? (
          <div className="bg-white border shadow-sm rounded-xl p-4">
            <Link
              href="/insights"
              className="flex items-center justify-between mb-2 text-sm font-semibold text-gray-600"
            >
              <span>인사이트</span>
              <ChevronRightIcon className="w-5 h-5 text-gray-400" />
            </Link>
            <p className="text-sm text-gray-800">
              {getInsightSnippet(insight)}
            </p>
          </div>
        ) : (
          <div className="bg-white border shadow-sm rounded-xl p-4 flex flex-col gap-3">
            <Link
              href="/insights"
              className="flex items-center justify-between text-sm font-semibold text-gray-600"
            >
              <span>인사이트 (샘플)</span>
              <ChevronRightIcon className="w-5 h-5 text-gray-400" />
            </Link>
            <ul className="text-sm text-gray-700 list-disc list-inside space-y-1">
              {[
                "고객들이 '친절'과 '청결'을 가장 많이 언급합니다.",
                "커피 맛 만족도가 높지만, 가격 언급이 종종 등장합니다.",
                "피크타임 대기 시간이 불만 포인트로 반복됩니다.",
                "시그니처 메뉴에 대한 긍정 언급이 꾸준히 유지됩니다.",
                "사진 리뷰 비중이 높아 비주얼이 구매 결정에 기여합니다.",
              ].map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* 태그 */}
      <div className="bg-white border rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <Link
            href="/insights/keywords"
            className="text-sm font-semibold text-gray-600 flex items-center justify-between w-full"
          >
            <span className="flex items-center gap-2">키워드 태그</span>
            <ChevronRightIcon className="w-5 h-5 text-gray-400" />
          </Link>
        </div>
        <div className="flex flex-wrap gap-2">
          {(insight?.tags && insight.tags.length
            ? insight.tags
            : insight?.tag && insight.tag.length
            ? insight.tag
            : ["친절", "청결", "맛", "가격", "대기"]
          )
            .slice(0, 5)
            .map((tag: string, i: number) => (
              <Link
                key={i}
                href="/insights/keywords"
                className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
              >
                {tag}
              </Link>
            ))}
        </div>
      </div>

      {/* ===================== */}
      {/* 3) 기간 필터 */}
      {/* ===================== */}
      <section>
        <div className="flex gap-2 flex-wrap">
          <div className="flex gap-2">
            {[
              { value: "30", label: "최근 1개월" },
              { value: "today", label: "오늘" },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  setRange(opt.value);
                  setCustomFrom("");
                  setCustomTo("");
                }}
                className={`px-3 py-1 rounded-full border shadow-sm text-sm ${
                  range === opt.value && !customFrom && !customTo
                    ? "bg-blue-500 text-white"
                    : "bg-white text-gray-700"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-sm">
            <input
              type="date"
              value={customFrom}
              onChange={(e) => {
                setCustomFrom(e.target.value);
                setRange("custom");
              }}
              className="border rounded-lg px-3 py-1"
            />
            <span>~</span>
            <input
              type="date"
              value={customTo}
              onChange={(e) => {
                setCustomTo(e.target.value);
                setRange("custom");
              }}
              className="border rounded-lg px-3 py-1"
            />
            <span className="text-xs text-gray-500">(최대 1년)</span>
          </div>
        </div>
      </section>

      {/* ===================== */}
      {/* 4) 긍정/부정 추이 차트 */}
      {/* ===================== */}
      <section>
        <Link
          href="/insights/sentiment"
          className="flex items-center justify-between mb-2 text-base font-semibold text-gray-700"
        >
          <span className="flex items-center gap-2">
            고객 반응 그래프
          </span>
          <ChevronRightIcon className="w-5 h-5 text-gray-400" />
        </Link>
        <div className="bg-white border rounded-xl shadow-sm p-3">
          <RatingChart data={chartData} variant="sentiment" />
        </div>
      </section>

      {/* ===================== */}
      {/* 5) 통계 박스 */}
      {/* ===================== */}
      <section>
        <Link
          href="/insights/sentiment"
          className="flex items-center justify-between mb-2 text-base font-semibold text-gray-700"
        >
          <span className="flex items-center gap-2">요약 통계</span>
          <ChevronRightIcon className="w-5 h-5 text-gray-400" />
        </Link>
        <div className="grid grid-cols-3 gap-3">
          <InsightBox label="기간 내 리뷰" value={rangeFiltered.length} />
          <InsightBox
            label="긍정 리뷰"
            value={
              rangeFiltered.filter(
                (r: any) => (r.summary?.sentiment || "") === "positive"
              ).length
            }
          />
          <InsightBox
            label="부정 리뷰"
            value={
              rangeFiltered.filter(
                (r: any) => (r.summary?.sentiment || "") === "negative"
              ).length
            }
          />
        </div>
      </section>

      {/* ===================== */}
      {/* 6) 최근 요약 스니펫 */}
      {/* ===================== */}
      <section>
        <div className="bg-white border rounded-xl shadow-sm p-4 space-y-3">
          <Link
            href="/insights"
            className="flex items-center justify-between text-sm font-semibold text-gray-700"
          >
            <span className="flex items-center gap-2">최근 요약 3건</span>
            <ChevronRightIcon className="w-5 h-5 text-gray-400" />
          </Link>
          {rangeFiltered.slice(0, 3).map((r: any) => (
            <div key={r.id} className="border rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">{r.platform}</p>
              <p className="text-sm text-gray-800">
                {r.summary
                  ? getInsightSnippet(r.summary)
                  : "요약 준비 중입니다."}
              </p>
              {r.reviewId && (
                <a
                  href={`https://map.naver.com/p/entry/place/${r.reviewId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex text-[11px] text-blue-600 underline"
                >
                  플랫폼에서 보기
                </a>
              )}
            </div>
          ))}
          {rangeFiltered.length === 0 && (
            <p className="text-sm text-gray-500">표시할 요약이 없습니다.</p>
          )}
        </div>
      </section>
    </div>
  );
}

function InsightBox({ label, value }: { label: string; value: any }) {
  return (
    <div className="bg-white border shadow-sm rounded-xl p-4 text-center">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}

function getInsightSnippet(ins: any) {
  const sources = [
    ...(ins?.insights || []),
    ...(ins?.positives || ins?.positive || []),
    ...(ins?.negatives || ins?.negative || []),
    ...(ins?.keywords || []),
  ].filter(Boolean);

  const text = sources.join(" · ");
  if (!text) return "리포트 생성 후 인사이트를 확인하세요.";
  return text.length > 80 ? text.slice(0, 80) + "..." : text;
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
