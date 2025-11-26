"use client";

import useAuthGuard from "@/app/hooks/useAuthGuard";
import useAuth from "@/app/hooks/useAuth";
import { useRouter } from "next/navigation";

export default function MyPage() {
  const { loading: authLoading, user } = useAuthGuard();
  const { logout } = useAuth();
  const router = useRouter();

  if (authLoading || !user) return <div className="p-6">로딩 중...</div>;

  return (
    <div className="min-h-screen bg-[#f8f8f8] pt-[60px] pb-[90px] px-4 space-y-6 animate-fadeIn">
      <section className="bg-white rounded-2xl shadow-sm border p-4 flex items-center gap-3">
        <div className="h-12 w-12 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-lg">
          {user?.email?.[0]?.toUpperCase() || "U"}
        </div>
        <div>
          <p className="text-sm text-gray-500">로그인 계정</p>
          <p className="text-base font-semibold">{user?.email || "알 수 없음"}</p>
        </div>
      </section>

      <section className="bg-white rounded-2xl shadow-sm border p-4 space-y-3">
        <h2 className="text-sm font-semibold text-gray-700">채널/매장 정보</h2>
        <InfoRow label="매장 이름" value={user?.storeName || "미등록"} />
        <InfoRow label="매장 URL" value={user?.storeUrl || "미등록"} />
        <InfoRow label="Place ID" value={user?.placeId || "미등록"} />
        <button
          onClick={() => router.push("/start/flow")}
          className="w-full mt-2 rounded-xl bg-gray-100 text-gray-800 py-2 text-sm active:scale-95"
        >
          채널 설정 변경하기
        </button>
      </section>

      <section className="bg-white rounded-2xl shadow-sm border p-4 space-y-3">
        <h2 className="text-sm font-semibold text-gray-700">앱 설정</h2>
        <button
          onClick={() => alert("준비 중입니다.")}
          className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 text-sm"
        >
          알림 설정
        </button>
        <button
          onClick={() => alert("준비 중입니다.")}
          className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 text-sm"
        >
          공지/이벤트 보기
        </button>
        <button
          onClick={() => alert("준비 중입니다.")}
          className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 text-sm"
        >
          약관 및 개인정보
        </button>
      </section>

      <section className="bg-white rounded-2xl shadow-sm border p-4 space-y-3">
        <h2 className="text-sm font-semibold text-gray-700">계정</h2>
        <button
          onClick={() => {
            logout();
            router.replace("/onboarding/intro");
          }}
          className="w-full text-left px-3 py-2 rounded-lg hover:bg-red-50 text-sm text-red-600"
        >
          로그아웃
        </button>
      </section>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm border rounded-lg px-3 py-2 bg-gray-50">
      <span className="text-gray-600">{label}</span>
      <span className="text-gray-900 font-medium truncate max-w-[55%] text-right">
        {value}
      </span>
    </div>
  );
}
