"use client";

import { useRouter, usePathname } from "next/navigation";

const items = [
  { label: "홈", path: "/" },
  { label: "대시보드", path: "/dashboard" },
  { label: "리뷰", path: "/review/[id]" },
  { label: "설정", path: "/setup-store" },
];

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-[60px] bg-white border-t shadow-sm flex justify-around items-center z-50 max-w-[430px] mx-auto">
      {items.map((item) => (
        <button
          key={item.path}
          onClick={() => router.push(item.path)}
          className={`flex-1 text-center text-sm ${
            pathname === item.path ? "text-blue-500 font-bold" : "text-gray-500"
          }`}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}
