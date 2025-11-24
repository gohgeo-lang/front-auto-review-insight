"use client";

import { useRouter, usePathname } from "next/navigation";
import useAuth from "@/app/hooks/useAuth";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const loggedIn = !!user;

  const pageTitle =
    {
      "/": "Review Auto Insight",
      "/dashboard": "대시보드",
      "/setup-store": "매장 등록",
    }[pathname] || "리뷰 상세";

  const showBack =
    pathname.startsWith("/review/") ||
    pathname === "/setup-store" ||
    pathname === "/auth/login" ||
    pathname === "/auth/register";

  const handleLogout = () => {
    logout();
    router.push("/auth/login");
  };

  return (
    <header
      className="
      fixed top-0 left-0 right-0 z-50
      bg-white/90 backdrop-blur-md
      border-b border-gray-200
      h-[60px] flex items-center justify-between
      px-3 shadow-sm
    "
    >
      {showBack ? (
        <button
          onClick={() => router.back()}
          className="text-gray-700 text-lg font-bold active:scale-95"
        >
          ←
        </button>
      ) : (
        <div className="w-5" />
      )}

      <div className="text-base font-semibold truncate text-center flex-1">
        {pageTitle}
      </div>

      {loggedIn ? (
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="w-8 h-8 rounded-full bg-blue-500 text-white"
          />
          <button
            onClick={handleLogout}
            className="text-xs bg-blue-500 text-white px-3 py-1 rounded-md"
          >
            로그아웃
          </button>
        </div>
      ) : (
        <button
          className="text-sm bg-blue-500 text-white px-3 py-1 rounded-md active:scale-95"
          onClick={() => router.push("/auth/login")}
        >
          로그인
        </button>
      )}
    </header>
  );
}
