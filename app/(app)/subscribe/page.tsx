"use client";

import { useEffect, useState } from "react";
import useAuthGuard from "@/app/hooks/useAuthGuard";
import { api } from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Store = {
  id: string;
  name?: string | null;
  placeId?: string | null;
};

export default function SubscribePage() {
  const { user, loading: authLoading } = useAuthGuard();
  const router = useRouter();
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get("/store");
        setStores(res.data || []);
      } catch {
        setStores([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (authLoading || !user) return <div className="p-6">로딩 중...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-sky-50 pt-[60px] pb-[90px] px-4 space-y-5 animate-fadeIn">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-gray-900">정기 리포트 구독</h1>
        <p className="text-sm text-gray-600">
          구독 중인 매장을 선택하거나, 새로운 매장을 구독하세요.
        </p>
      </header>

      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 space-y-3">
        <h2 className="text-sm font-semibold text-gray-800">내 매장</h2>
        {loading ? (
          <p className="text-sm text-gray-500">불러오는 중...</p>
        ) : stores.length === 0 ? (
          <p className="text-sm text-gray-500">구독된 매장이 없습니다.</p>
        ) : (
          <div className="space-y-2">
            {stores.map((s) => (
              <Link
                key={s.id}
                href={`/subscribe/product?storeId=${s.id}`}
                className="block border border-gray-100 rounded-xl p-3 bg-white shadow-xs text-sm text-gray-800"
              >
                <p className="font-semibold">{s.name || "매장"}</p>
              </Link>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={() => router.push("/start/flow")}
        className="w-full py-3 rounded-xl bg-white border border-gray-200 text-sm text-gray-800 active:scale-95"
      >
        다른 매장 구독하기
      </button>

      <button
        onClick={() => router.back()}
        className="w-full py-2 rounded-xl bg-gray-100 text-gray-800 text-sm active:scale-95"
      >
        돌아가기
      </button>
    </div>
  );
}
