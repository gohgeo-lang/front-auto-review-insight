"use client";

import { useEffect, useState } from "react";
import useAuthGuard from "@/app/hooks/useAuthGuard";
import { api } from "@/lib/api";
import StoryModal from "@/components/StoryModal";
import RatingChart from "@/components/RatingChart";

export default function Dashboard() {
  // 로그인 보호 (로그인 안 되어 있으면 자동 redirect)
  const { loading: authLoading, user } = useAuthGuard();

  const [reviews, setReviews] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [platform, setPlatform] = useState("all");
  const [search, setSearch] = useState("");
  const [insight, setInsight] = useState<any>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalLabel, setModalLabel] = useState("");

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
        const ins = await api.get(`/insight/${user?.id}`).catch(() => null);
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

  // =============================
  // 4) 차트 데이터 생성
  // =============================
  function getChartData() {
    const map: any = {};
    filteredSearch.forEach((r: any) => {
      const day = r.createdAt.split("T")[0];
      if (!map[day]) map[day] = { total: 0, count: 0 };
      map[day].total += r.rating;
      map[day].count += 1;
    });

    return Object.keys(map)
      .sort()
      .slice(-7)
      .map((d) => ({
        date: d,
        rating: Number((map[d].total / map[d].count).toFixed(1)),
      }));
  }

  const chartData = getChartData();

  // =============================
  // 5) 렌더링
  // =============================
  return (
    <div className="min-h-screen bg-[#fafafa] pt-[50px] pb-[90px] px-4 space-y-6 animate-fadeIn">
      {/* ===================== */}
      {/* 1) 타이틀 */}
      {/* ===================== */}
      <section>
        <h1 className="text-2xl font-bold">대시보드</h1>
        <p className="text-gray-600 text-sm mt-1">
          오늘 리뷰 흐름을 한눈에 확인하세요.
        </p>
      </section>

      {/* ===================== */}
      {/* 2) 스토리 카드 */}
      {/* ===================== */}
      <section>
        <div className="flex gap-4 overflow-x-auto no-scrollbar">
          {[
            "전체 리뷰",
            "긍정 TOP",
            "부정 TOP",
            "최근 7일",
            "AI 요약 모음",
          ].map((label, idx) => (
            <div
              key={idx}
              className="flex flex-col items-center cursor-pointer flex-shrink-0"
              onClick={() => {
                setModalLabel(label);
                setModalOpen(true);
              }}
            >
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-pink-500 to-yellow-400 p-[3px]">
                <div className="w-full h-full bg-white rounded-full flex items-center justify-center text-sm font-semibold">
                  {label.slice(0, 2)}
                </div>
              </div>
              <p className="text-xs mt-1 text-gray-600">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 모달 */}
      <StoryModal
        open={modalOpen}
        label={modalLabel}
        onClose={() => setModalOpen(false)}
      />

      {/* ===================== */}
      {/* 3) 검색창 */}
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
      {/* 4) AI 인사이트 */}
      {/* ===================== */}
      <section>
        {insight ? (
          <div className="bg-white border shadow-sm rounded-xl p-4">
            <p className="text-sm font-semibold text-gray-600 mb-2">인사이트</p>
            <p className="text-sm mb-1">긍정: {insight.positives.join(", ")}</p>
            <p className="text-sm">부정: {insight.negatives.join(", ")}</p>
          </div>
        ) : (
          <div className="text-gray-500 text-sm">인사이트 없음</div>
        )}
      </section>

      {/* 태그 */}
      {insight?.tags && (
        <div className="bg-white border rounded-lg p-4 mb-4 slide-up">
          <p className="text-sm font-semibold mb-2 text-gray-600">
            키워드 태그
          </p>
          <div className="flex flex-wrap gap-2">
            {insight.tags.map((tag: string, i: number) => (
              <span
                key={i}
                className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ===================== */}
      {/* 5) 평점 변화 차트 */}
      {/* ===================== */}
      <section>
        <RatingChart data={chartData} />
      </section>

      {/* ===================== */}
      {/* 6) 통계 박스 */}
      {/* ===================== */}
      <section>
        <div className="grid grid-cols-3 gap-3">
          <InsightBox label="오늘 리뷰" value={filteredSearch.length} />
          <InsightBox
            label="평균 평점"
            value={
              filteredSearch.length > 0
                ? (
                    filteredSearch.reduce(
                      (acc: number, r: any) => acc + r.rating,
                      0
                    ) / filteredSearch.length
                  ).toFixed(1)
                : "-"
            }
          />
          <InsightBox
            label="긍정 비율"
            value={
              filteredSearch.length > 0
                ? Math.round(
                    (filteredSearch.filter((r: any) => r.rating >= 4).length /
                      filteredSearch.length) *
                      100
                  ) + "%"
                : "-"
            }
          />
        </div>
      </section>

      {/* ===================== */}
      {/* 7) 플랫폼 필터 */}
      {/* ===================== */}
      <section>
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
      </section>

      {/* ===================== */}
      {/* 8) 리뷰 리스트 */}
      {/* ===================== */}
      <section>
        {filteredSearch.length === 0 && (
          <div className="text-gray-500 text-center py-20">
            검색 결과가 없습니다.
          </div>
        )}

        <div className="space-y-4">
          {filteredSearch.map((r: any) => (
            <div
              key={r.id}
              className="bg-white border shadow-sm rounded-xl p-4 cursor-pointer active:scale-95 transition"
              onClick={() => (window.location.href = `/review/${r.id}`)}
            >
              <div className="flex justify-between mb-2">
                <span className="text-xs text-gray-500">{r.platform}</span>
                <span className="text-sm bg-yellow-300 px-2 py-1 rounded-md">
                  ⭐ {r.rating}
                </span>
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
