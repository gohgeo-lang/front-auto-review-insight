"use client";

import { useRouter } from "next/navigation";

export default function NotificationButton() {
  const router = useRouter();
  return (
    <button
      onClick={() => router.push("/notifications")}
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
