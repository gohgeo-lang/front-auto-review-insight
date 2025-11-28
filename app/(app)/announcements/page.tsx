"use client";

import useAuthGuard from "@/app/hooks/useAuthGuard";

const mockAnnouncements = [
  {
    title: "신규 기능: 멀티 매장 지원",
    date: "2025-02-10",
    body: "플랜별 허용 매장 수에 맞춰 여러 매장을 추가하고 인사이트를 분리해서 확인할 수 있습니다.",
  },
  {
    title: "AI 요약 정책 안내",
    date: "2025-02-02",
    body: "무료 플랜에서는 최근 30일·최대 300건까지 요약합니다. 유료 플랜에서는 확장된 범위로 분석할 수 있습니다.",
  },
  {
    title: "서비스 점검 예정",
    date: "2025-01-28",
    body: "2/15(토) 02:00~03:00 사이 백엔드 점검으로 크롤링/요약 호출이 일시 중단될 수 있습니다.",
  },
];

export default function AnnouncementsPage() {
  const { loading, user } = useAuthGuard();
  if (loading || !user) return <div className="p-6">로딩 중...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-sky-50 pt-[60px] pb-[90px] px-4 space-y-4 animate-fadeIn">
      <h1 className="text-xl font-bold text-gray-800">공지/이벤트</h1>
      <div className="space-y-3">
        {mockAnnouncements.map((a, idx) => (
          <article
            key={idx}
            className="bg-white rounded-2xl border border-gray-100 shadow-xs p-4 space-y-1"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-800">{a.title}</p>
              <span className="text-xs text-gray-500">{a.date}</span>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">{a.body}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
