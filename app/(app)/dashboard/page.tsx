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
  const [filtered, setFiltered] = useState([]);
  const [platform, setPlatform] = useState("all");
  const [search, setSearch] = useState("");
  const [insight, setInsight] = useState<any>(null);
  const [range, setRange] = useState("30"); // days filter default 1개월
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [batchLoading, setBatchLoading] = useState(false);

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
        setFiltered(rv.data);

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
  // 2) 플랫폼 필터
  // =============================
  function filterByPlatform(p: string) {
    setPlatform(p);
    if (p === "all") setFiltered(reviews);
    else setFiltered(reviews.filter((r: any) => r.platform === p));
  }

  // =============================
  // 3) 검색 + 필터 통합
  // =============================
  const filteredSearch = filtered.filter((r: any) =>
    (r.content + r.platform).toLowerCase().includes(search.toLowerCase())
  );

  // 기간 필터 적용
  const rangeFiltered = filteredSearch.filter((r: any) => {
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
    const map: Record<string, { positive: number; negative: number }> = {};
    rangeFiltered.forEach((r: any) => {
      const day = r.createdAt.split("T")[0];
      if (!map[day]) map[day] = { positive: 0, negative: 0, irrelevant: 0 };
      const sentiment = r.summary?.sentiment || "irrelevant";
      if (sentiment === "positive") map[day].positive += 1;
      else if (sentiment === "negative") map[day].negative += 1;
      else map[day].irrelevant += 1;
    });

    return Object.keys(map)
      .sort()
      .map((d) => ({
        date: d,
        positive: map[d].positive,
        negative: map[d].negative,
        irrelevant: map[d].irrelevant,
      }));
  }

  const chartData = getChartData();

  const missingCount = reviews.filter((r: any) => !r.summary).length;

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
              감성 흐름과 키워드를 한눈에 확인하세요.
            </p>
          </div>
        </div>
      </section>

      {/* ===================== */}
      {/* 2) 검색창 */}
      {/* ===================== */}
      <section>
        <input
          type="text"
          placeholder="리뷰 검색..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border px-4 py-3 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </section>

      {/* ===================== */}
      {/* 3) AI 인사이트 */}
      {/* ===================== */}
      <section>
        {insight ? (
          <div className="bg-white border shadow-sm rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-gray-600">인사이트</p>
              <Link
                href="/insights"
                className="text-xs text-blue-600 underline"
              >
                리포트 보기
              </Link>
            </div>
            <p className="text-sm text-gray-800">
              {getInsightSnippet(insight)}
            </p>
          </div>
        ) : (
          <div className="text-gray-500 text-sm">인사이트 없음</div>
        )}
      </section>

      {/* 태그 */}
      {(insight?.tags || insight?.tag) && (
        <div className="bg-white border rounded-lg p-4 mb-4 slide-up">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-gray-600">키워드 태그</p>
            <Link
              href="/insights/keywords"
              className="text-xs text-blue-600 underline"
            >
              자세히
            </Link>
          </div>
          <div className="flex flex-wrap gap-2">
            {(insight.tags || insight.tag || []).map(
              (tag: string, i: number) => (
                <span
                  key={i}
                  className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                >
                  {tag}
                </span>
              )
            )}
          </div>
        </div>
      )}

      {/* ===================== */}
      {/* 4) 긍정/부정 추이 차트 */}
      {/* ===================== */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-base font-semibold text-gray-700">
            긍정/부정 추이
          </h2>
          <Link
            href="/insights/sentiment"
            className="text-xs text-blue-600 underline"
          >
            상세 보기
          </Link>
        </div>
        <RatingChart data={chartData} variant="sentiment" />
      </section>

      {/* ===================== */}
      {/* 5) 통계 박스 */}
      {/* ===================== */}
      <section>
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
      {/* 6) 기간/플랫폼 필터 */}
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

          <div className="flex gap-2">
            {["all", "Naver", "Kakao", "Google"].map((p) => (
              <button
                key={p}
                onClick={() => filterByPlatform(p)}
                className={`px-3 py-1 rounded-full border shadow-sm text-sm ${
                  platform === p
                    ? "bg-blue-500 text-white"
                    : "bg-white text-gray-700"
                }`}
              >
                {p === "all" ? "전체" : p}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== */}
      {/* 7) 리뷰 리스트 */}
      {/* ===================== */}
      <section>
        {rangeFiltered.length === 0 && (
          <div className="text-gray-500 text-center py-20">
            검색 결과가 없습니다.
          </div>
        )}

        <div className="space-y-4">
          {rangeFiltered.map((r: any) => (
            <div
              key={r.id}
              className="bg-white border shadow-sm rounded-xl p-4"
            >
              <div className="flex justify-between mb-2">
                <span className="text-xs text-gray-500">{r.platform}</span>
              </div>
              <p className="text-gray-800 text-sm line-clamp-2">{r.content}</p>
            </div>
          ))}
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
