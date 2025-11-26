"use client";

import { useRouter } from "next/navigation";

export default function OnboardingLogin() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50 px-6 py-10 flex flex-col">
      <div className="flex justify-between items-center mb-8">
        <div className="text-sm font-bold text-blue-700">RIB</div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
        <div className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
          Onboarding
        </div>
        <h1 className="text-3xl font-bold text-gray-900">RIB</h1>
        <p className="text-sm text-gray-600">
          리뷰 자동 수집과 AI 인사이트 리포트, 한 번에.
        </p>
      </div>

      <div className="space-y-3 w-full max-w-sm mx-auto mb-6">
        <button
          onClick={() => router.push("/auth/register")}
          className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm"
        >
          회원가입하기
        </button>
        <button
          onClick={() => router.push("/auth/login")}
          className="w-full py-3 rounded-xl border text-sm text-gray-700"
        >
          기존 이메일로 로그인하기
        </button>
      </div>
    </div>
  );
}
