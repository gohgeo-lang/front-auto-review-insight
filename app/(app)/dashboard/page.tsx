"use client";

import { useEffect, useMemo, useState } from "react";
import useAuthGuard from "@/app/hooks/useAuthGuard";
import { api } from "@/lib/api";
import RatingChart from "@/components/RatingChart";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

type Store = { id: string; name?: string | null; placeId?: string | null };
type ReviewSummary = {
  id: string;
  storeId?: string | null;
  createdAt: string;
  summary?: { sentiment?: "positive" | "negative" | "neutral" | "irrelevant" };
};
type InsightData = {
  insights?: string[];
  negatives?: string[];
  positives?: string[];
  keywords?: string[];
  tags?: string[];
};
type ReportSummary = {
  id: string;
  period: string;
  createdAt: string;
  rangeDays: number;
  payload?: any;
};

export default function Dashboard() {
  // 로그인 보호 (로그인 안 되어 있으면 자동 redirect)
  const { loading: authLoading, user } = useAuthGuard();
  const searchParams = useSearchParams();

  const [reviews, setReviews] = useState<ReviewSummary[]>([]);
  const [insight, setInsight] = useState<InsightData | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [storeLoading, setStoreLoading] = useState(true);
  const [range, setRange] = useState("30"); // days filter default 1개월
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [latestReport, setLatestReport] = useState<ReportSummary | null>(null);
  const [reportMsg, setReportMsg] = useState<string | null>(null);

  // =============================
  // 0) 매장 로딩
  // =============================
  useEffect(() => {
    if (!user) return;
    async function loadStores() {
      try {
        const res = await api.get("/store");
        const list: Store[] = res.data || [];
        setStores(list);
        const paramId = searchParams.get("storeId");
        const validParam = list.find((s) => s.id === paramId)?.id || null;
        const saved = localStorage.getItem("lastStoreId");
        const validSaved = list.find((s) => s.id === saved)?.id || null;
        const first = list[0]?.id || null;
        const pick = validParam || validSaved || first || null;
        if (pick) {
          setSelectedStoreId(pick);
          localStorage.setItem("lastStoreId", pick);
        }
      } catch {
        setStores([]);
      } finally {
        setStoreLoading(false);
      }
    }
    loadStores();
  }, [user, searchParams]);

  // =============================
  // 1) 데이터 로딩 (매장 선택 이후)
  // =============================
  useEffect(() => {
    if (!user || !selectedStoreId) return; // 로그인 보호 + 매장 선택 필요

    async function load() {
      try {
        // 리뷰 전체 불러오기
        const rv = await api.get<ReviewSummary[]>("/reviews", {
          params: { storeId: selectedStoreId },
        });
        setReviews(rv.data || []);

        // 사용자 인사이트 불러오기
        const ins = await api
          .get<InsightData>(`/insight`, { params: { storeId: selectedStoreId } })
          .catch(() => null);
        setInsight(ins?.data || null);

        // 최신 리포트 가져오기 (있으면 1개)
        const rep = await api
          .get<ReportSummary[]>("/reports", { params: { storeId: selectedStoreId } })
          .catch(() => null);
        setLatestReport(rep?.data?.[0] || null);
      } catch (err) {
        console.error("리뷰 로딩 실패:", err);
      }
    }

    load();
  }, [user, selectedStoreId]);

  // =============================
  // 2) 기간 필터 적용
  // =============================
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

  // =============================
  // 4) 긍정/부정 차트 데이터 생성 (요약 기반)
  // =============================
  const chartData = useMemo(() => {
    const map: Record<
      string,
      { positive: number; negative: number; neutral: number; irrelevant: number }
    > = {};
    rangeFiltered.forEach((r) => {
      const day = r.createdAt.split("T")[0];
      if (!map[day]) map[day] = { positive: 0, negative: 0, neutral: 0, irrelevant: 0 };
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
  }, [rangeFiltered]);
  const insightItems = [
    ...(insight?.insights || []),
    ...(insight?.positives || insight?.positive || []),
    ...(insight?.negatives || insight?.negative || []),
    ...(insight?.keywords || []),
  ].filter(Boolean);
  const hasInsight = insightItems.length > 0;
  const currentStore = stores.find((s) => s.id === selectedStoreId);
  const noStore = !storeLoading && stores.length === 0;

  // AuthContext 로딩 중에는 깜빡임 방지
  if (authLoading || !user) {
    return <div className="p-8 text-center">로딩 중...</div>;
  }

  // 매장이 없는 경우 안내
  if (noStore) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-sky-50 pt-[50px] pb-[90px] px-4 space-y-4 animate-fadeIn">
        <div>
          <h1 className="text-2xl font-bold">대시보드</h1>
          <p className="text-gray-600 text-sm mt-1">
            먼저 매장을 등록한 뒤 대시보드를 확인하세요.
          </p>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-4 flex justify-between items-center">
          <div>
            <p className="text-sm font-semibold text-gray-800">등록된 매장이 없습니다.</p>
            <p className="text-xs text-gray-500">매장을 추가하면 각 매장별 인사이트를 볼 수 있습니다.</p>
          </div>
          <Link
            href="/stores"
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold"
          >
            매장 등록
          </Link>
        </div>
      </div>
    );
  }

  // =============================
  // 5) 렌더링
  // =============================
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-sky-50 pt-[50px] pb-[90px] px-4 space-y-6 animate-fadeIn">
      {/* ===================== */}
      {/* 1) 타이틀 + 매장 선택 */}
      {/* ===================== */}
      <section>
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>
          {currentStore && (
            <div className="text-right">
              <p className="text-xs text-gray-500">현재 매장</p>
              <p className="text-sm font-semibold text-gray-800">
                {currentStore.name || "매장"}{" "}
              </p>
              <p className="text-[11px] text-gray-500">placeId: {currentStore.placeId}</p>
            </div>
          )}
        </div>
        <p className="text-gray-600 text-sm mt-1">
          고객들의 반응을 분석한 흐름과 키워드를 한눈에 확인하세요.
        </p>
      </section>

      {/* ===================== */}
      {/* 2) AI 인사이트 */}
      {/* ===================== */}
      <section>
        {hasInsight ? (
          <div className="bg-white border border-gray-100 shadow-xs rounded-xl p-4">
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
          <div className="bg-white border border-gray-100 shadow-xs rounded-xl p-4 flex flex-col gap-3">
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

      {/* ===================== */}
      {/* 3) 최신 리포트 */}
      {/* ===================== */}
      <section className="bg-white border border-gray-100 rounded-xl shadow-xs p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-800">리포트</p>
            <p className="text-xs text-gray-500">
              최근 생성된 리포트를 확인하세요. 무료는 1회 체험 후 추가 리포트는 결제가 필요합니다.
            </p>
          </div>
          <Link href="/reports" className="text-xs text-blue-600 flex items-center gap-1">
            전체 보기 <ChevronRightIcon className="w-4 h-4" />
          </Link>
        </div>
        {latestReport ? (
          <button
            onClick={() => (window.location.href = `/reports/${latestReport.id}`)}
            className="w-full text-left border rounded-lg p-3 bg-gray-50 hover:bg-white active:scale-98 transition"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-800">
                {labelPeriod(latestReport.period)} 리포트
              </p>
              <span className="text-xs text-gray-500">{latestReport.createdAt.slice(0, 10)}</span>
            </div>
            <p className="text-xs text-gray-600 mt-1">범위: 최근 {latestReport.rangeDays}일</p>
            <p className="text-xs text-gray-600">
              총 리뷰: {latestReport.payload?.totalReviews ?? "-"}
            </p>
          </button>
        ) : (
          <div className="text-sm text-gray-600">
            리포트가 없습니다. 아래 버튼으로 생성해 보세요.
          </div>
        )}
        <div className="flex items-center gap-2">
          <button
            onClick={async () => {
              if (!selectedStoreId) return;
              setReportMsg(null);
              try {
                await api.post("/reports/generate", {
                  storeId: selectedStoreId,
                  period: "monthly",
                  rangeDays: 30,
                });
                setReportMsg("리포트 생성 요청 완료. 잠시 후 목록에 표시됩니다.");
                const rep = await api.get<ReportSummary[]>("/reports", {
                  params: { storeId: selectedStoreId },
                });
                setLatestReport(rep.data?.[0] || null);
              } catch (err: any) {
                const code = err?.response?.data?.error;
                if (code === "REPORT_PAYMENT_REQUIRED") {
                  setReportMsg("무료 리포트 1회를 사용했습니다. 추가 리포트는 결제가 필요합니다.");
                } else {
                  setReportMsg("리포트 생성 실패. 잠시 후 다시 시도하세요.");
                }
              }
            }}
            className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold active:scale-95"
          >
            월간 리포트 생성
          </button>
          {reportMsg && <span className="text-xs text-gray-600">{reportMsg}</span>}
        </div>
      </section>

      {/* 태그 */}
          <div className="bg-white border border-gray-100 rounded-lg p-4 mb-4">
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
      {/* 4) 고객 반응 통계 */}
      {/* ===================== */}
      <section>
        <Link
          href="/insights/sentiment"
          className="flex items-center justify-between mb-2 text-base font-semibold text-gray-700"
        >
          <span className="flex items-center gap-2">고객 반응 통계</span>
          <ChevronRightIcon className="w-5 h-5 text-gray-400" />
        </Link>
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-3 space-y-3">
          <RatingChart data={chartData} variant="sentiment" />
          <div className="grid grid-cols-3 gap-3">
            <InsightBox label="전체" value={rangeFiltered.length} />
            <InsightBox
              label="긍정"
              value={
                rangeFiltered.filter(
                  (r: any) => (r.summary?.sentiment || "") === "positive"
                ).length
              }
            />
            <InsightBox
              label="부정"
              value={
                rangeFiltered.filter(
                  (r: any) => (r.summary?.sentiment || "") === "negative"
                ).length
              }
            />
          </div>
        </div>
      </section>

    </div>
  );
}

function InsightBox({ label, value }: { label: string; value: any }) {
  return (
    <div className="bg-white border border-gray-100 shadow-sm rounded-xl p-4 text-center">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}

function labelPeriod(p: string) {
  if (p === "weekly") return "주간";
  if (p === "monthly") return "월간";
  if (p === "quarterly") return "분기";
  if (p === "yearly") return "연간";
  return p;
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
