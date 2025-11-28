"use client";

import { useRouter } from "next/navigation";

const plans = [
  {
    name: "무료",
    price: "₩0",
    period: "월",
    subtitle: "필수 기능만 가볍게",
    features: [
      "매장 1개 · 최근 30일/300건 수집·분석 + 리포트 1회 무료(추가 리포트는 건당 결제)",
      "요약/키워드/감성 기본 인사이트",
      "자동 확장: 리뷰 적으면 최대 365일, 300건까지 자동 확대",
    ],
    cta: "기본으로 사용 중",
    highlight: false,
  },
  {
    name: "구독",
    price: "₩3,000",
    period: "월 · 매장당",
    subtitle: "자동 리포트 + 여유 한도",
    features: [
      "매장당 구독(추가 매장 = +₩3,000/월)",
      "확장된 한도(여유 있는 수집 범위)",
      "자동 주간/월간/분기/연간 리포트(추가 결제 없음)",
      "접속하지 않아도 주기 수집/분석 실행",
    ],
    cta: "구독하기",
    highlight: true,
  },
];

export default function PlansPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-sky-50 pt-[60px] pb-[90px] px-4 space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">요금제</h1>
          <p className="text-sm text-gray-600 mt-1">
            무료로 시작하고, 필요한 만큼 구독/크레딧을 추가하세요.
          </p>
        </div>
        <button
          onClick={() => router.back()}
          className="text-sm text-blue-600 underline"
        >
          돌아가기
        </button>
      </div>

      <div className="grid gap-4">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`bg-white border rounded-xl p-4 space-y-3 ${
              plan.highlight ? "border-blue-200 shadow-md bg-blue-50/40" : "border-gray-100 shadow-xs"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">{plan.period}</p>
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  {plan.name}
                  {plan.highlight && (
                    <span className="text-[11px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                      추천
                    </span>
                  )}
                </h2>
                <p className="text-xs text-gray-500 mt-1">{plan.subtitle}</p>
              </div>
              <p className="text-xl font-bold text-blue-600 text-right">
                {plan.price}
              </p>
            </div>
            <ul className="text-sm text-gray-700 space-y-1">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                  {f}
                </li>
              ))}
            </ul>
            <button className="w-full py-2 rounded-lg border text-sm text-gray-800 active:scale-95">
              {plan.cta}
            </button>
          </div>
        ))}
      </div>

    </div>
  );
}
