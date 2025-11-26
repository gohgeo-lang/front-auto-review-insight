"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function StartGate() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50 px-6 py-10 flex flex-col items-center justify-center space-y-6">
      <div className="text-center space-y-2">
        <div className="text-xs font-semibold text-blue-700 tracking-wide">
          RIB · Review Insight Bot
        </div>
        <h1 className="text-3xl font-bold text-gray-900">RIB</h1>
        <p className="text-sm text-gray-600">
          리뷰 자동 수집, 분석, 리포트를 순서대로 진행하세요.
        </p>
      </div>

      <div className="w-full max-w-sm bg-white border rounded-2xl shadow-sm p-5 space-y-3">
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

      <Link
        href="/start/flow"
        className="text-xs text-blue-600 underline"
      >
        기능 온보딩으로 이동
      </Link>
    </div>
  );
}
