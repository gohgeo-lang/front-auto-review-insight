"use client";

import { useEffect, useState } from "react";
import useAuthGuard from "@/app/hooks/useAuthGuard";
import { api } from "@/lib/api";

export default function InsightsPage() {
  const { loading: authLoading, user } = useAuthGuard();
  const [insight, setInsight] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const sampleRecent = [
    "최근 방문자들은 친절과 청결을 가장 많이 언급했습니다.",
    "시그니처 메뉴에 대한 긍정 리뷰가 꾸준히 유지되고 있습니다.",
    "피크타임 대기 시간이 일부 불만 요소로 반복됩니다.",
  ];

  useEffect(() => {
    if (!user) return;
    async function load() {
      setLoading(true);
      try {
        const ins = await api.get("/insight").catch(() => null);
        setInsight(ins?.data || null);
      } catch (err) {
        console.error("인사이트 로드 실패", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  if (authLoading || !user) {
    return <div className="p-8 text-center">로딩 중...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-sky-50 pt-[50px] pb-[90px] px-4 space-y-6 animate-fadeIn">
      <section>
        <h1 className="text-2xl font-bold text-gray-900">리뷰 인사이트</h1>
        <p className="text-gray-600 text-sm mt-1">
          대시보드에서 모아온 인사이트 리포트를 자세히 확인하세요.
        </p>
      </section>

      <section className="bg-white border border-gray-100 rounded-xl shadow-xs p-4 space-y-6">
        <InsightSection
          title="💡 핵심 인사이트"
          tags={insight?.keywords || []}
          solutions={insight?.insights || sampleRecent}
        />
        <InsightSection
          title="✨ 강점 요약"
          tags={insight?.positives || ["친절", "청결", "시그니처 메뉴 만족도"]}
          solutions={[
            "친절/청결을 유지하고 시그니처 메뉴 퀄리티를 강조하세요.",
            "사진 리뷰가 많은 강점을 마케팅에 활용하세요.",
          ]}
        />
        <InsightSection
          title="🛠️ 개선점 요약"
          tags={insight?.negatives || ["피크타임 대기시간", "가격 언급 반복"]}
          solutions={[
            "피크타임 대기 관리(번호표/알림)로 불만을 줄이세요.",
            "가격 언급이 반복된다면 세트/프로모션으로 가성비를 강조하세요.",
          ]}
        />
        <InsightSection
          title="📈 트렌드 변화"
          tags={insight?.trends || ["최근 4주간 긍정 비율 소폭 상승", "대기시간 언급 감소 추세"]}
          solutions={[
            "긍정 추세가 유지되도록 친절/청결 교육을 지속하세요.",
            "대기시간 감소를 유지하기 위해 피크타임 인력 배치 점검",
          ]}
        />
        <InsightSection
          title="🗒️ 최근 리뷰 요약"
          tags={(insight?.tags || insight?.tag || []).slice(0, 5)}
          solutions={insight?.recentSummaries || sampleRecent}
        />
        <div className="text-sm text-gray-800 leading-relaxed">
          <p className="font-semibold mb-1">🏪 매장 설명 (브랜딩용)</p>
          <p>
            {insight?.description ||
              "고객들이 가장 많이 언급한 친절과 청결을 강점으로, 시그니처 메뉴가 사랑받는 공간입니다. 편안한 분위기와 안정적인 맛으로 재방문 의사가 높은 매장으로 인식되고 있습니다."}
          </p>
        </div>
      </section>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-lg font-semibold mb-2">{children}</h2>;
}

function InsightSection({
  title,
  tags,
  solutions,
}: {
  title: string;
  tags: string[];
  solutions: string[];
}) {
  if (!tags?.length && !solutions?.length) return null;
  return (
    <div className="border border-gray-100 rounded-lg p-4 space-y-2 shadow-xs">
      <p className="text-sm font-semibold">{title}</p>
      <div className="flex flex-wrap gap-2">
        {(tags || []).slice(0, 10).map((t, i) => (
          <span
            key={`${t}-${i}`}
            className="px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs"
          >
            {t}
          </span>
        ))}
      </div>
      <div className="space-y-1 text-sm text-gray-800">
        {(solutions || []).map((s, i) => (
          <p key={i} className="leading-relaxed">
            • {s}
          </p>
        ))}
      </div>
    </div>
  );
}
