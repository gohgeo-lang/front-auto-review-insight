"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();

  const [loggedIn, setLoggedIn] = useState(false);

  // 페이지 타이틀 자동 생성
  const pageTitle =
    {
      "/": "Review Auto Insight",
      "/dashboard": "대시보드",
      "/setup-store": "매장 등록",
    }[pathname] || "리뷰 상세";

  // 뒤로가기 버튼이 필요한 페이지
  const showBack =
    pathname.startsWith("/review/") ||
    pathname === "/setup-store" ||
    pathname === "/auth/login" ||
    pathname === "/auth/register";

  useEffect(() => {
    const token = localStorage.getItem("token");
    setLoggedIn(!!token);
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setLoggedIn(false);
    router.push("/auth/login");
  };

  return (
    <header
      className="
      fixed top-0 left-0 right-0 z-50
      bg-white/90 backdrop-blur-md
      border-b border-gray-200 
      safe-top
      h-[60px] flex items-center justify-between
      px-3 shadow-sm
    "
    >
      {/* 좌측: 뒤로가기 버튼 */}
      {showBack ? (
        <button
          onClick={() => router.back()}
          className="text-gray-700 text-lg font-bold active:scale-95"
        >
          ←
        </button>
      ) : (
        <div className="w-5" /> // 공간 유지용
      )}

      {/* 중앙: 페이지 타이틀 */}
      <div className="text-base font-semibold truncate text-center flex-1">
        {pageTitle}
      </div>

      {/* 우측: 로그인 / 아바타 */}
      {loggedIn ? (
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="w-8 h-8 rounded-full bg-gray-300 active:scale-95 button-active bg-blue-500 text-white py-2 px-4 rounded-lg"
          />
          <button
            onClick={handleLogout}
            className="text-xs bg-gray-100 px-3 py-1 rounded-md button-active bg-blue-500 text-white py-2 px-4 rounded-lg"
          >
            로그아웃
          </button>
        </div>
      ) : (
        <button
          className="text-sm bg-blue-500 text-white px-3 py-1 rounded-md active:scale-95 button-active bg-blue-500 text-white py-2 px-4 rounded-lg"
          onClick={() => router.push("/auth/login")}
        >
          로그인
        </button>
      )}
    </header>
  );
}
