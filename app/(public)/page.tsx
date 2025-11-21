"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  // 로그인한 사용자는 홈 화면을 보지 않고 바로 Dashboard로 이동
  useEffect(() => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (token) {
      router.replace("/dashboard");
    }
  }, [router]);

  return (
    <div className="px-5 py-10 max-w-md mx-auto">
      {/* 헤더 텍스트 */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold leading-tight mb-3">
          리뷰 관리를
          <br />
          <span className="text-blue-600">AI가 대신합니다.</span>
        </h1>

        <p className="text-gray-600 text-[15px] leading-relaxed">
          네이버 · 카카오 · 구글 리뷰를 자동 수집하고
          <br />
          핵심 분석과 응대문까지 한 번에.
        </p>
      </div>

      {/* 온보딩 카드 */}
      <div className="space-y-4 mb-10">
        <div className="bg-white rounded-2xl shadow-sm border p-5">
          <p className="text-lg font-semibold mb-1">리뷰 자동 수집</p>
          <p className="text-gray-600 text-sm">
            여러 플랫폼의 리뷰를 한곳에 모아드립니다.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border p-5">
          <p className="text-lg font-semibold mb-1">AI 분석 요약</p>
          <p className="text-gray-600 text-sm">
            긍정·부정 포인트, 불만 패턴을 자동 분석합니다.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border p-5">
          <p className="text-lg font-semibold mb-1">자동 응대문 생성</p>
          <p className="text-gray-600 text-sm">
            사장님 톤에 맞는 응답을 자동으로 만들어드립니다.
          </p>
        </div>
      </div>

      {/* CTA 버튼 */}
      <div className="space-y-3">
        <Link href="/auth/login">
          <button className="w-full py-4 bg-blue-600 text-white rounded-xl font-semibold text-base">
            로그인하기
          </button>
        </Link>

        <Link href="/auth/register">
          <button className="w-full py-4 bg-gray-200 text-gray-900 rounded-xl font-semibold text-base">
            회원가입
          </button>
        </Link>
      </div>
    </div>
  );
}
