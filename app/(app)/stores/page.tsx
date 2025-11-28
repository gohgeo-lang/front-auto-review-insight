"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/lib/api";
import useAuthGuard from "@/app/hooks/useAuthGuard";
import Link from "next/link";
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
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [placeId, setPlaceId] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [upgradeNeeded, setUpgradeNeeded] = useState(false);
  const [autoCrawlEnabled, setAutoCrawlEnabled] = useState(true);
  const [autoReportEnabled, setAutoReportEnabled] = useState(true);
  const [savingStoreId, setSavingStoreId] = useState<string | null>(null);
  const [creditLoading, setCreditLoading] = useState(false);

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
        name,
        url,
        placeId,
        autoCrawlEnabled,
        autoReportEnabled,
      });
      setStatus("매장이 등록되었습니다.");
      setName("");
      setUrl("");
      setPlaceId("");
      setAutoCrawlEnabled(true);
      setAutoReportEnabled(true);
      setUpgradeNeeded(false);
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

  const planLimit = useMemo(() => {
    const quota = (user as any)?.storeQuota;
    if (typeof quota === "number" && quota > 0) return quota;
    return 1;
  }, [user]);

  const limitReached = stores.length >= planLimit;
  const credits = (user as any)?.extraCredits ?? 0;

  async function addCredits(amount: number) {
    setCreditLoading(true);
    setStatus(null);
    try {
      const res = await api.post("/billing/credits", { amount });
      setStatus(`크레딧 ${amount}개가 추가되었습니다.`);
      // 최신 유저 정보 반영
      await refresh();
    } catch {
      setStatus("크레딧 추가 실패. 잠시 후 다시 시도하세요.");
    } finally {
      setCreditLoading(false);
    }
  }

  async function toggleStoreSettings(id: string, key: "autoCrawlEnabled" | "autoReportEnabled", value: boolean) {
    setSavingStoreId(id);
    try {
      const res = await api.post("/store/settings", {
        storeId: id,
        [key]: value,
      });
      setStores((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...res.data } : s))
      );
    } catch {
      setStatus("설정 저장 실패. 잠시 후 다시 시도하세요.");
    } finally {
      setSavingStoreId(null);
    }
  }

  if (authLoading || !user) return <div className="p-6">로딩 중...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-sky-50 pt-[60px] pb-[90px] px-4 space-y-6 animate-fadeIn">
      <section className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">매장/채널 관리</h1>
          <p className="text-sm text-gray-600">
            여러 매장을 등록하고 필요할 때마다 수집/분석하세요.
          </p>
        </div>
      </section>

      <section className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 space-y-3">
        <h2 className="text-sm font-semibold text-gray-700">매장 등록</h2>
        <div className="text-xs text-gray-600 flex items-center gap-2">
          <span>추가 수집 크레딧: {credits}개</span>
          <button
            onClick={() => addCredits(500)}
            disabled={creditLoading}
            className="px-2 py-1 border rounded-lg text-[11px] text-blue-700 border-blue-200 hover:bg-blue-50 disabled:opacity-50"
          >
            크레딧 500 추가(테스트)
          </button>
        </div>
        {limitReached && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-xl text-xs text-yellow-800">
            현재 구독 한도를 모두 사용했습니다. 구독을 업그레이드하면 더 많은 매장을 추가할 수 있습니다.
          </div>
        )}
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="매장 이름 (선택)"
          disabled={limitReached}
          className="w-full border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 disabled:bg-gray-50 disabled:text-gray-500"
        />
        <div className="flex gap-2">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="네이버 플레이스 URL"
            disabled={limitReached}
            className="flex-1 border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 disabled:bg-gray-50 disabled:text-gray-500"
          />
          <button
            onClick={handleExtract}
            disabled={loading || limitReached}
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
          disabled={limitReached}
          className="w-full border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 disabled:bg-gray-50 disabled:text-gray-500"
        />
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-700">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={autoCrawlEnabled}
              onChange={(e) => setAutoCrawlEnabled(e.target.checked)}
              disabled={limitReached}
            />
            자동 수집
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={autoReportEnabled}
              onChange={(e) => setAutoReportEnabled(e.target.checked)}
              disabled={limitReached}
            />
            자동 리포트
          </label>
        </div>
        <button
          onClick={handleSave}
          disabled={loading || limitReached}
          className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold text-sm active:scale-95 disabled:opacity-60"
        >
          {loading ? "등록 중..." : "매장 저장"}
        </button>
        {status && <p className="text-xs text-gray-600">{status}</p>}
        {(upgradeNeeded || limitReached) && (
          <Link
            href="/plans"
            className="inline-flex items-center justify-center gap-2 text-sm text-blue-700 font-semibold underline"
          >
            플랜 업그레이드 하기
          </Link>
        )}
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
                  {s.placeId ? <span>placeId: {s.placeId}</span> : <span>placeId 없음</span>}
                </div>
                <p className="text-[11px] text-gray-500">
                  등록일: {(s.createdAt || "").slice(0, 10)}
                </p>
                <div className="flex items-center gap-3 text-xs text-gray-700">
                  <label className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={s.autoCrawlEnabled !== false}
                      disabled={savingStoreId === s.id}
                      onChange={(e) =>
                        toggleStoreSettings(s.id, "autoCrawlEnabled", e.target.checked)
                      }
                    />
                    자동 수집
                  </label>
                  <label className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={s.autoReportEnabled !== false}
                      disabled={savingStoreId === s.id}
                      onChange={(e) =>
                        toggleStoreSettings(s.id, "autoReportEnabled", e.target.checked)
                      }
                    />
                    자동 리포트
                  </label>
                  {savingStoreId === s.id && <span className="text-[11px] text-blue-600">저장 중...</span>}
                </div>
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
