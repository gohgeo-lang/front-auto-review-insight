"use client";

import { useRouter } from "next/navigation";

const tips = [
  {
    title: "리뷰 수집 안정화 팁",
    desc: "placeId가 올바른지 확인하고, 최초 수집 후 자동 수집을 켜 두세요.",
  },
  {
    title: "인사이트 활용법",
    desc: "긍정/부정 키워드를 보고 메뉴/서비스 개선 아이템을 바로 실행해 보세요.",
  },
  {
    title: "리포트 받기",
    desc: "주간/월간 리포트를 설정하면 접속하지 않아도 자동으로 받아볼 수 있습니다.",
  },
];

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-sky-50 pt-[60px] pb-[90px] px-4 space-y-6 animate-fadeIn">
      {/* 헤더 타이틀 */}
      <section className="space-y-2">
        <h1 className="text-2xl font-bold text-gray-900">우리 매장 리포트 받아보기</h1>
        <p className="text-sm text-gray-600">
          한 번의 무료 체험으로 인사이트를 받아보고, 구독으로 정기 리포트를 자동으로 받아보세요.
        </p>
      </section>

      {/* 검색창 */}
      <section>
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-3 flex items-center gap-2">
          <input
            type="text"
            placeholder="매장 이름, placeId 또는 URL을 검색하세요"
            className="flex-1 text-sm px-3 py-2 rounded-xl border focus:ring-2 focus:ring-blue-400"
          />
          <button className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold active:scale-95">
            검색
          </button>
        </div>
      </section>

      {/* 광고/배너 영역 (더미) */}
      <section className="bg-gradient-to-r from-sky-500 to-indigo-500 text-white rounded-2xl p-4 shadow-sm">
        <p className="text-xs uppercase font-semibold mb-1">Ad / Banner</p>
        <h3 className="text-lg font-bold">AI 인사이트, 더 빠르고 가볍게</h3>
        <p className="text-sm text-blue-50 mt-1">
          리뷰를 자동 수집·분석해 주기 리포트까지 한 번에 받아보세요.
        </p>
      </section>

      {/* 탭 영역: 무료 체험 vs 정기 리포트 */}
      <section className="grid grid-cols-2 gap-3">
        <button
          onClick={() => router.push("/start/flow")}
          className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 text-left space-y-2 hover:bg-gray-50 active:scale-98"
        >
          <p className="text-sm font-semibold text-blue-700">무료 1회 인사이트</p>
          <p className="text-xs text-gray-600">
            가입 후 매장 등록하면 리뷰 수집·분석 1회 무료 체험
          </p>
          <span className="text-[11px] text-gray-500">최근 30일 · 300건까지</span>
        </button>
        <button
          onClick={() => router.push("/plans")}
          className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 text-left space-y-2 hover:bg-gray-50 active:scale-98"
        >
          <p className="text-sm font-semibold text-blue-700">정기 리포트 받기</p>
          <p className="text-xs text-gray-600">
            구독으로 주간/월간/분기/연간 리포트를 자동 발행
          </p>
          <span className="text-[11px] text-gray-500">매장당 ₩3,000/월</span>
        </button>
      </section>

      {/* 슬로건 */}
      <section className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4">
        <p className="text-sm font-semibold text-gray-900">
          “리뷰를 직접 보지 않아도, 운영에 필요한 인사이트를 자동으로”
        </p>
        <p className="text-xs text-gray-600 mt-1">
          수집 · 요약 · 키워드 · 감성 분석 · 리포트 발행까지 한 번에 처리합니다.
        </p>
      </section>

      {/* 가이드/팁 카드 */}
      <section className="space-y-2">
        <p className="text-sm font-semibold text-gray-800">가이드 & 팁</p>
        <div className="grid gap-3">
          {tips.map((tip) => (
            <div
              key={tip.title}
              className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 space-y-1"
            >
              <p className="text-sm font-semibold text-gray-900">{tip.title}</p>
              <p className="text-xs text-gray-600">{tip.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
