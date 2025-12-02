"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import useAuthGuard from "@/app/hooks/useAuthGuard";
import useAuth from "@/app/hooks/useAuth";

type Store = {
  id: string;
  name?: string | null;
  url?: string | null;
  placeId?: string | null;
  createdAt?: string;
  autoCrawlEnabled?: boolean;
  autoReportEnabled?: boolean;
};

export default function StoresPage() {
  const { loading: authLoading, user } = useAuthGuard();
  const { refresh } = useAuth();
  const [stores, setStores] = useState<Store[]>([]);
  const didSync = useRef(false);
  const [url, setUrl] = useState("");
  const [placeId, setPlaceId] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (didSync.current) return;
    didSync.current = true;
    (async () => {
      await refresh(); // 최신 구독/한도 동기화
      await loadStores();
    })();
  }, [user, refresh]);

  async function loadStores() {
    try {
      const res = await api.get("/store");
      setStores(res.data || []);
    } catch {
      setStores([]);
    }
  }

  async function handleExtract() {
    if (!url) return alert("URL을 입력하세요.");
    setLoading(true);
    setStatus("placeId 추출 중...");
    try {
      const res = await api.post("/store/extract", { url });
      setPlaceId(res.data.placeId);
      setStatus(`placeId 추출 성공: ${res.data.placeId}`);
    } catch {
      setStatus("placeId 추출 실패. URL을 확인하세요.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!placeId) return alert("placeId를 입력하세요.");
    setLoading(true);
    setStatus("매장 등록 중...");
    try {
      await api.post("/store/register-store", {
        url,
        placeId,
      });
      setStatus("매장이 등록되었습니다.");
      setUrl("");
      setPlaceId("");
      loadStores();
    } catch (err: any) {
      const code = err?.response?.data?.error;
      if (code === "STORE_LIMIT_EXCEEDED") {
        setStatus(
          "구독 한도 초과: 더 많은 매장을 등록하려면 구독을 업그레이드하세요."
        );
        setUpgradeNeeded(true);
      } else {
        setStatus("매장 등록 실패. 값을 확인하세요.");
      }
    } finally {
      setLoading(false);
    }
  }

  if (authLoading || !user) return <div className="p-6">로딩 중...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-sky-50 pt-[60px] pb-[90px] px-4 space-y-6 animate-fadeIn">
      <section className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">채널 연결</h1>
          <p className="text-sm text-gray-600">
            네이버 placeId를 등록해 채널을 연결하세요. (구글/카카오 준비 중)
          </p>
        </div>
      </section>

      <section className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 space-y-3">
        <h2 className="text-sm font-semibold text-gray-700">네이버 플레이스</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="네이버 플레이스 URL"
            className="flex-1 border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400"
          />
          <button
            onClick={handleExtract}
            disabled={loading}
            className="px-3 py-2 rounded-xl bg-blue-50 text-blue-700 text-sm border border-blue-100 active:scale-95 disabled:opacity-50"
          >
            {loading ? "추출 중..." : "placeId 추출"}
          </button>
        </div>
        <input
          type="text"
          value={placeId}
          onChange={(e) => setPlaceId(e.target.value)}
          placeholder="placeId 직접 입력"
          className="w-full border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400"
        />
        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold text-sm active:scale-95 disabled:opacity-60"
        >
          {loading ? "등록 중..." : "매장 저장"}
        </button>
        {status && <p className="text-xs text-gray-600">{status}</p>}
      </section>

      <section className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 space-y-3">
        <h2 className="text-sm font-semibold text-gray-700">등록된 매장</h2>
        {stores.length === 0 ? (
          <p className="text-sm text-gray-500">등록된 매장이 없습니다.</p>
        ) : (
          <div className="space-y-2">
            {stores.map((s) => (
              <div
                key={s.id}
                className="border rounded-lg p-3 bg-gray-50 text-sm text-gray-800 space-y-2"
              >
                <p className="font-semibold">{s.name || "매장"}</p>
                <div className="flex items-center gap-2 text-[11px] text-gray-600">
                  <Badge label="Naver" />
                  <span>등록일: {(s.createdAt || "").slice(0, 10)}</span>
                </div>
                <p className="text-xs text-gray-600">자동 수집/리포트 설정은 향후 지원 예정입니다.</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Badge({ label }: { label: string }) {
  return (
    <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-700 border border-blue-200 text-[11px]">
      {label}
    </span>
  );
}
