"use client";

import { useRouter, usePathname } from "next/navigation";

const items = [
  { label: "홈", path: "/home", icon: HomeIcon },
  { label: "분석", path: "/analysis", icon: ChartIcon },
  { label: "리포트", path: "/reports", icon: ReportIcon },
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
    <nav className="fixed bottom-0 left-0 right-0 h-[64px] bg-white/95 backdrop-blur border-t border-gray-200 shadow-sm flex justify-around items-center z-50 max-w-[430px] mx-auto">
      {items.map((item) => (
        <button
          key={item.path}
          onClick={() => router.push(item.path)}
          className={`flex-1 text-center text-[12px] flex flex-col items-center gap-1 ${
            pathname?.startsWith(item.path) ? "text-blue-600 font-bold" : "text-gray-500"
          }`}
        >
          <item.icon className="w-5 h-5" />
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}

function HomeIcon({ className }: { className?: string }) {
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
      <path d="m3 11 9-8 9 8" />
      <path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
      <path d="M9 21V9h6v12" />
    </svg>
  );
}

function ChartIcon({ className }: { className?: string }) {
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
      <path d="M3 3v18h18" />
      <path d="M7 17V9" />
      <path d="M12 17V5" />
      <path d="M17 17v-7" />
      <circle cx="12" cy="8" r="1.5" />
      <circle cx="17" cy="10" r="1.5" />
      <circle cx="7" cy="12" r="1.5" />
    </svg>
  );
}

function ReportIcon({ className }: { className?: string }) {
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
      <rect width="14" height="18" x="5" y="3" rx="2" />
      <path d="M9 7h6" />
      <path d="M9 11h6" />
      <path d="M9 15h4" />
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
