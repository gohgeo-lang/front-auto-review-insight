"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import useAuth from "@/app/hooks/useAuth";
import { api } from "@/lib/api";

export default function SubscribeProductPage({
  searchParams,
}: {
  searchParams?: { storeId?: string };
}) {
  const router = useRouter();
  const search = useSearchParams();
  const storeId = search?.get("storeId") || searchParams?.storeId;
  const { refresh } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("결제 진행 중...");
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    if (!showModal) return;
    const timer = setTimeout(() => {
      setModalMessage("결제가 완료되었습니다. 3초 후 닫힙니다.");
      const closeTimer = setTimeout(() => {
        setShowModal(false);
        // 결제 완료 후 마이페이지 정기 리포트 탭으로 이동
        router.push("/mypage?tab=subscription");
      }, 3000);
      return () => clearTimeout(closeTimer);
    }, 500);
    return () => clearTimeout(timer);
  }, [showModal, router, storeId]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-sky-50 pt-[40px] pb-[90px] px-4 space-y-5 animate-fadeIn">
      <div className="bg-white border border-blue-100 rounded-3xl shadow-md p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">정기 리포트 · 매장당</p>
            <h1 className="text-2xl font-bold text-gray-900">₩3,000 / 월</h1>
            <p className="text-sm text-gray-600 mt-1">
              주간/월간/분기/연간 리포트를 정기적으로 받아볼 수 있습니다.
            </p>
          </div>
          <span className="text-[10px] px-1 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            구독
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm text-gray-800">
          <FeatureCard
            title="자동 발행"
            desc="주간·월간·분기·연간 리포트 자동 생성"
          />
          <FeatureCard
            title="더 넓은 수집"
            desc="리뷰 수집 범위를 여유 있게 확대"
          />
          <FeatureCard
            title="무방문 운영"
            desc="접속 없이 수집·분석·리포트까지 자동"
          />
          <FeatureCard
            title="인사이트 강화"
            desc="감성/키워드/개선 포인트까지 정리"
          />
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-3 text-sm text-blue-800">
          리포트는 등록된 매장별로 발행됩니다. 원하는 매장을 선택 후 결제하세요.
        </div>

        <button
          onClick={() => {
            if (!storeId) {
              alert("구독할 매장을 먼저 선택해주세요.");
              router.push("/subscribe");
              return;
            }
            setSubscribing(true);
            setModalMessage("결제 진행 중...");
            setShowModal(true);
            // 더미 결제 + 구독 활성화 API
            api
              .post("/billing/subscribe-store", { storeId })
              .then(async () => {
                await refresh?.();
                setModalMessage("결제가 완료되었습니다. 3초 후 닫힙니다.");
              })
              .catch(() => {
                setModalMessage("결제 처리에 실패했습니다. 잠시 후 다시 시도해주세요.");
              })
              .finally(() => setSubscribing(false));
          }}
          className="w-full py-3 rounded-xl bg-blue-600 text-white text-sm font-semibold active:scale-95"
          disabled={subscribing}
        >
          결제하기
        </button>
        <button
          onClick={() => router.push("/mypage")}
          className="w-full py-2 rounded-xl bg-gray-100 text-gray-800 text-sm active:scale-95"
        >
          돌아가기
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-5 space-y-3 text-center">
            <h3 className="text-lg font-semibold text-gray-900">결제 진행</h3>
            <p className="text-sm text-gray-700">{modalMessage}</p>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 animate-pulse" />
            </div>
            <p className="text-xs text-gray-500">더미 결제입니다. 실제 과금은 발생하지 않습니다.</p>
          </div>
        </div>
      )}
    </div>
  );
}

function FeatureCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="border border-gray-100 rounded-xl p-3 bg-gray-50 space-y-1">
      <p className="text-sm font-semibold text-gray-900">{title}</p>
      <p className="text-xs text-gray-600">{desc}</p>
    </div>
  );
}
