"use client";

import { useRouter, usePathname } from "next/navigation";

const items = [
  { label: "대시보드", path: "/dashboard", icon: DashboardIcon },
  { label: "마이페이지", path: "/mypage", icon: UserIcon },
];

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  const hiddenRoutes = ["/start/flow", "/start", "/onboarding/intro", "/onboarding/login"];
  if (hiddenRoutes.some((p) => pathname?.startsWith(p))) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-[60px] bg-white border-t shadow-sm flex justify-around items-center z-50 max-w-[430px] mx-auto">
      {items.map((item) => (
        <button
          key={item.path}
          onClick={() => router.push(item.path)}
          className={`flex-1 text-center text-sm flex flex-col items-center gap-1 ${
            pathname === item.path ? "text-blue-600 font-bold" : "text-gray-500"
          }`}
        >
          <span
            className={`inline-flex h-9 w-9 items-center justify-center rounded-full ${
              pathname === item.path ? "bg-blue-50 text-blue-600" : "bg-gray-100 text-gray-700"
            }`}
          >
            <item.icon className="w-5 h-5" />
          </span>
        </button>
      ))}
    </nav>
  );
}

function DashboardIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 3h7v9H3z" />
      <path d="M14 3h7v5h-7z" />
      <path d="M14 12h7v9h-7z" />
      <path d="M3 16h7v5H3z" />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="7" r="4" />
      <path d="M5.5 21a6.5 6.5 0 0 1 13 0" />
    </svg>
  );
}
