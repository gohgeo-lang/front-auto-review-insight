"use client";

import useAuthGuard from "@/app/hooks/useAuthGuard";

const mockNotices = [
  { title: "새 리뷰가 도착했어요", body: "네이버에서 5건의 신규 리뷰가 수집되었습니다.", time: "방금 전" },
  { title: "인사이트 업데이트", body: "키워드·감성 리포트가 새로 생성됐습니다.", time: "1시간 전" },
  { title: "공지", body: "베타 기간 중 요약 호출은 일일 200회로 제한됩니다.", time: "어제" },
];

export default function NotificationsPage() {
  const { loading, user } = useAuthGuard();
  if (loading || !user) return <div className="p-6">로딩 중...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-sky-50 pt-[60px] pb-[90px] px-4 space-y-4 animate-fadeIn">
      <h1 className="text-xl font-bold text-gray-800">알림</h1>
      <div className="space-y-3">
        {mockNotices.map((n, idx) => (
          <div
            key={idx}
            className="bg-white rounded-xl border border-gray-100 shadow-xs p-4 space-y-1"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-800">{n.title}</p>
              <span className="text-xs text-gray-500">{n.time}</span>
            </div>
            <p className="text-sm text-gray-600">{n.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
