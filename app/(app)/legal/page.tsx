"use client";

import useAuthGuard from "@/app/hooks/useAuthGuard";

const legalSections = [
  {
    title: "개인정보 처리방침 (요약)",
    body: "이메일, 닉네임, 매장 URL/PlaceId 등 최소 정보만 저장하며 리뷰 텍스트는 요약·통계용으로만 사용합니다. 제3자 제공은 하지 않으며, 회원 탈퇴 시 즉시 삭제됩니다.",
  },
  {
    title: "서비스 이용약관 (요약)",
    body: "본 서비스는 수집한 리뷰를 분석하여 인사이트를 제공하는 도구입니다. 크롤링된 원문을 재게시하지 않으며, 분석 결과는 참고용으로 제공됩니다.",
  },
  {
    title: "알림/마케팅 동의",
    body: "시스템 알림은 필수, 리뷰/인사이트 알림은 선택, 프로모션/공지 알림은 별도 동의 후 발송됩니다. 알림 설정 페이지에서 언제든 변경 가능합니다.",
  },
];

export default function LegalPage() {
  const { loading, user } = useAuthGuard();
  if (loading || !user) return <div className="p-6">로딩 중...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-sky-50 pt-[60px] pb-[90px] px-4 space-y-4 animate-fadeIn">
      <h1 className="text-xl font-bold text-gray-800">약관 및 개인정보</h1>
      <div className="space-y-3">
        {legalSections.map((s, idx) => (
          <section
            key={idx}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-2"
          >
            <p className="text-sm font-semibold text-gray-800">{s.title}</p>
            <p className="text-sm text-gray-600 leading-relaxed">{s.body}</p>
          </section>
        ))}
      </div>
      <p className="text-xs text-gray-500">
        * 본 문구는 개발 중 더미 내용입니다. 실제 운영 시 최신 정책으로 교체하세요.
      </p>
    </div>
  );
}
