"use client";

import { useRouter, usePathname } from "next/navigation";
import useAuth from "@/app/hooks/useAuth";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();

  const hiddenRoutes = ["/start/flow", "/start", "/onboarding/intro", "/onboarding/login"];
  if (hiddenRoutes.some((p) => pathname?.startsWith(p))) {
    return null;
  }

  const showBack =
    pathname.startsWith("/review/") ||
    pathname === "/setup-store" ||
    pathname === "/auth/login" ||
    pathname === "/auth/register";

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
        <button
          onClick={() => router.push("/dashboard")}
          className="text-lg font-bold text-blue-700 active:scale-95"
        >
          RIB
        </button>
      )}

      <div className="flex-1" />

      <div className="flex items-center gap-3">
        {user && (
          <>
            <button
              onClick={() => router.push("/plans")}
              className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-800 active:scale-95"
              aria-label="요금제"
            >
              <BadgeIcon className="w-5 h-5" />
            </button>
            <NotificationButton onClick={() => router.push("/notifications")} />
          </>
        )}
      </div>
    </header>
  );
}

function NotificationButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="relative w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-800 active:scale-95"
      aria-label="알림"
    >
      <BellIcon className="w-5 h-5" />
      <span className="absolute top-2 right-2 inline-flex h-2 w-2 rounded-full bg-red-500" />
    </button>
  );
}

function BellIcon({ className }: { className?: string }) {
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
      <path d="M15 18a3 3 0 0 1-6 0" />
      <path d="M18.7 14.7a2 2 0 0 1-.7-1.53V10a6 6 0 1 0-12 0v3.17a2 2 0 0 1-.7 1.53L4 16h16z" />
    </svg>
  );
}

function BadgeIcon({ className }: { className?: string }) {
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
      <path d="M12 2 3 7l9 5 9-5-9-5Z" />
      <path d="M3 17l9 5 9-5" />
      <path d="M3 12l9 5 9-5" />
    </svg>
  );
}
