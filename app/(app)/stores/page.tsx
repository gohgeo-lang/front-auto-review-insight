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
  const [showEdit, setShowEdit] = useState(false);
  const [selected, setSelected] = useState<Store | null>(null);
  const [editName, setEditName] = useState("");
  const [editPlaceId, setEditPlaceId] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [editAutoCrawl, setEditAutoCrawl] = useState(true);
  const [editAutoReport, setEditAutoReport] = useState(true);

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
      setStatus("매장 등록 실패. 값을 확인하세요.");
    } finally {
      setLoading(false);
    }
  }

  const openEdit = (s: Store) => {
    setSelected(s);
    setEditName(s.name || "");
    setEditPlaceId(s.placeId || "");
    setEditUrl(s.url || "");
    setEditAutoCrawl(s.autoCrawlEnabled !== false);
    setEditAutoReport(s.autoReportEnabled !== false);
    setShowEdit(true);
  };

  const closeEdit = () => {
    setShowEdit(false);
    setSelected(null);
  };

  async function handleUpdate() {
    if (!selected) return;
    setLoading(true);
    setStatus("매장 정보 수정 중...");
    try {
      await api.put(`/store/${selected.id}`, {
        name: editName || null,
        placeId: editPlaceId || null,
        url: editUrl || null,
        autoCrawlEnabled: editAutoCrawl,
        autoReportEnabled: editAutoReport,
      });
      setStatus("매장 정보가 수정되었습니다.");
      await loadStores();
      closeEdit();
    } catch {
      setStatus("수정 실패. 값을 확인하세요.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    const ok = confirm("매장과 관련 리뷰/리포트를 모두 삭제할까요?");
    if (!ok) return;
    setLoading(true);
    setStatus("삭제 중...");
    try {
      await api.delete(`/store/${id}`);
      setStatus("삭제되었습니다.");
      await loadStores();
      if (selected?.id === id) closeEdit();
    } catch {
      setStatus("삭제 실패. 다시 시도하세요.");
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
                <p className="text-xs text-gray-600">
                  자동 수집/리포트 설정은 향후 지원 예정입니다. 연결된 플랫폼을 추가로 등록하거나 정보를 수정할 수 있습니다.
                </p>
                <div className="flex items-center gap-2 text-xs">
                  <button
                    onClick={() => openEdit(s)}
                    className="px-3 py-2 rounded-lg bg-white border border-gray-200 text-gray-800 active:scale-95"
                  >
                    정보 수정
                  </button>
                  <button
                    onClick={() => handleDelete(s.id)}
                    className="px-3 py-2 rounded-lg bg-red-50 border border-red-100 text-red-600 active:scale-95"
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {showEdit && selected && (
        <div className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-5 space-y-3">
            <h3 className="text-lg font-semibold text-gray-900">매장 정보 수정</h3>
            <div className="space-y-2">
              <label className="text-xs text-gray-600">상호명</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400"
              />
              <label className="text-xs text-gray-600">네이버 placeId</label>
              <input
                type="text"
                value={editPlaceId}
                onChange={(e) => setEditPlaceId(e.target.value)}
                className="w-full border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400"
              />
              <label className="text-xs text-gray-600">매장 URL (네이버)</label>
              <input
                type="text"
                value={editUrl}
                onChange={(e) => setEditUrl(e.target.value)}
                className="w-full border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400"
              />
              <div className="grid grid-cols-2 gap-2 text-sm text-gray-700">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editAutoCrawl}
                    onChange={(e) => setEditAutoCrawl(e.target.checked)}
                  />
                  <span>자동 수집</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editAutoReport}
                    onChange={(e) => setEditAutoReport(e.target.checked)}
                  />
                  <span>자동 리포트</span>
                </label>
              </div>
              <div className="text-xs text-gray-500 space-y-1">
                <p>기타 플랫폼 연결 (준비 중):</p>
                <div className="flex gap-2 flex-wrap">
                  <Badge label="Google (준비 중)" />
                  <Badge label="Kakao (준비 중)" />
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleUpdate}
                disabled={loading}
                className="flex-1 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold active:scale-95 disabled:opacity-60"
              >
                {loading ? "저장 중..." : "저장"}
              </button>
              <button
                onClick={closeEdit}
                className="px-3 py-2 rounded-lg bg-gray-100 text-sm text-gray-800 active:scale-95"
              >
                닫기
              </button>
            </div>
            <button
              onClick={() => handleDelete(selected.id)}
              className="w-full py-2 rounded-lg bg-red-50 border border-red-100 text-sm text-red-600 active:scale-95"
            >
              매장 삭제
            </button>
          </div>
        </div>
      )}
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
