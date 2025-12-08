"use client";

import { useEffect, useState } from "react";
import useAuthGuard from "@/app/hooks/useAuthGuard";
import useAuth from "@/app/hooks/useAuth";
import { api } from "@/lib/api";
import { useRouter, useSearchParams } from "next/navigation";

type Store = {
  id: string;
  name?: string | null;
  placeId?: string | null;
  autoCrawlEnabled?: boolean;
  autoReportEnabled?: boolean;
  naverPlaceId?: string | null;
  googlePlaceId?: string | null;
  kakaoPlaceId?: string | null;
};

export default function MyPage() {
  const { loading: authLoading, user } = useAuthGuard();
  const { logout, refresh } = useAuth();
  const router = useRouter();
  const search = useSearchParams();
  const [stores, setStores] = useState<Store[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState<"recent" | "recurring">("recent");
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [gender, setGender] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [showScanModal, setShowScanModal] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [scanStore, setScanStore] = useState<Store | null>(null);
  const [scanLoading, setScanLoading] = useState(false);
  const [showChargeModal, setShowChargeModal] = useState(false);
  const [subscribingStore, setSubscribingStore] = useState<string | null>(null);
  const [showStoreModal, setShowStoreModal] = useState(false);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [scanLogs, setScanLogs] = useState<string[]>([]);
  const [scanStatus, setScanStatus] = useState<string | null>(null);
  const [showScanProgress, setShowScanProgress] = useState<null | "crawl" | "analysis">(null);

  useEffect(() => {
    async function loadStores() {
      try {
        const res = await api.get("/store");
        setStores(res.data || []);
      } catch {
        setStores([]);
      }
    }
    loadStores();
  }, []);

  useEffect(() => {
  // 최신 구독/이용권 상태 동기화
    refresh?.().catch(() => {});
  }, [refresh]);

  useEffect(() => {
    const tab = search?.get("tab");
    if (tab === "subscription") {
      setActiveTab("recurring");
    }
  }, [search]);

  useEffect(() => {
    setName(user?.name || "");
    setNickname(user?.nickname || "");
    setGender(user?.gender || "");
    setAddress(user?.address || "");
    const hasProfile =
      (user?.name && user.name.trim() !== "") ||
      (user?.nickname && user.nickname.trim() !== "") ||
      (user?.gender && user.gender.trim() !== "") ||
      (user?.address && user.address.trim() !== "");
    setEditingProfile(!hasProfile);
  }, [user]);

  if (authLoading || !user) return <div className="p-6">로딩 중...</div>;

  const handleSaveProfile = async () => {
    setSaving(true);
    setSaveMessage(null);
    try {
      await api.post("/auth/profile", { name, nickname, gender, address });
      const stored = localStorage.getItem("user");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const updated = { ...parsed, name, nickname, gender, address };
          localStorage.setItem("user", JSON.stringify(updated));
        } catch {
          // ignore
        }
      }
      setSaveMessage("저장되었습니다.");
    } catch {
      setSaveMessage("저장 실패. 값을 확인하세요.");
    } finally {
      setSaving(false);
    }
  };

  async function runScanFlow(store: Store, pidNaver?: string | null, pidGoogle?: string | null) {
    const targets: Array<["naver" | "google", string]> = [];
    if (pidNaver) targets.push(["naver", pidNaver]);
    if (pidGoogle) targets.push(["google", pidGoogle]);
    if (!targets.length) {
      setScanMessage("placeId가 없습니다. 채널을 다시 등록해주세요.");
      return;
    }

    setScanLoading(true);
    setShowScanProgress("crawl");
    setScanStatus("수집 중...");
    setScanLogs([]); // 기존 수집 로그 초기화

    const newLogs: string[] = [];
    const runSingle = async (endpoint: string, pid: string, label: string, skipCharge?: boolean) => {
      setScanStatus(`[${label}] 수집 중...`);
      setScanLogs((prev) => [...(prev.length ? prev : []), `[${label}] 수집 시작`]);
      const res = await api.post(endpoint, { placeId: pid, storeId: store.id, skipCharge });
      const added = res.data?.added ?? 0;
      const rangeDays = res.data?.rangeDays;
      const limitedBy = res.data?.limitedBy;
      const rangeText = rangeDays ? `${rangeDays}일` : "전체";
      const limitText = limitedBy?.startsWith("days_") ? `(범위 ${rangeText})` : "";
      const addedMsg = `[${label}] 수집 완료: ${added}개 ${limitText}`.trim();
      const logArr: string[] = res.data?.logs || [];
      const metaLog = `[${label}] 범위: ${rangeText}, 최대 300개 적용`;
      newLogs.push(...(logArr.length ? logArr.map((l) => `[${label}] ${l}`) : [addedMsg]), metaLog);
      setScanLogs((prev) => [...prev, ...newLogs]);
    };

    try {
      let charged = false;
      for (const [platformName, pid] of targets) {
        const endpoint = platformName === "google" ? "/crawler/google" : "/crawler/naver";
        await runSingle(endpoint, pid, platformName === "google" ? "구글" : "네이버", charged);
        charged = true;
      }
      setScanLogs(newLogs.length ? newLogs : ["수집 완료"]);
      setScanStatus(newLogs[newLogs.length - 1] || "수집 완료");

      setShowScanProgress("analysis");
      setScanStatus("1차 분석(요약) 중...");
      setScanLogs((prev) => [...prev, "1차 분석(요약) 실행"]);
      await api.post("/ai/summary/missing", { storeId: store.id });
      setScanStatus("배치 요약 생성 중...");
      setScanLogs((prev) => [...prev, "배치 요약 생성"]);
      await api.post("/ai/summary/batch", { storeId: store.id });
      setScanStatus("2차 인사이트 리포트 생성 중...");
      setScanLogs((prev) => [...prev, "2차 인사이트 리포트 생성"]);
      await api.post("/ai/insight/report", { storeId: store.id });
      await refresh?.();

      setScanStatus("분석 및 리포트 생성 완료! 대시보드로 이동합니다.");
      setShowScanProgress(null);
      router.push(`/dashboard?storeId=${store.id}`);
    } catch (err: any) {
      const code = err?.response?.data?.error;
      if (code === "OPENAI_QUOTA_EXCEEDED") {
        setScanStatus("분석 실패: 쿼터를 확인하세요.");
      } else if (code === "CREDITS_REQUIRED") {
        setScanStatus("이용권이 부족합니다. 충전 후 이용해주세요.");
        setShowChargeModal(true);
      } else {
        setScanStatus("수집/분석 실패. 잠시 후 다시 시도해주세요.");
      }
      setShowScanProgress(null);
    } finally {
      setScanLoading(false);
      await refresh?.(); // 토큰/유저 최신화
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-sky-50 pt-[60px] pb-[90px] px-4 space-y-6 animate-fadeIn">
      <h1 className="text-xl font-bold text-gray-900">마이페이지</h1>

      <section className="bg-white rounded-2xl border border-gray-100 shadow-xs p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-lg">
            {user?.email?.[0]?.toUpperCase() || "U"}
          </div>
          <div>
            <p className="text-sm text-gray-500">
              {user?.nickname
                ? `${user.nickname}님, 안녕하세요`
                : "대표님, 안녕하세요"}
            </p>
            <p className="text-base font-semibold">
              {user?.email || "알 수 없음"}
            </p>
          </div>
          <button
            onClick={() => router.push("/profile")}
            className="text-[11px] text-blue-600 underline ml-auto"
          >
            정보 수정
          </button>
        </div>
        <div className="flex items-center justify-between text-sm text-gray-700 pt-2 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700">
              현재 보유 이용권: { (user as any)?.extraCredits ?? 0 }개
            </span>
          </div>
          <button
            onClick={() => router.push("/credits")}
            className="px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-800 active:scale-95"
          >
            충전하기
          </button>
        </div>
      </section>

      {showStoreModal && selectedStore && (
        <div className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-lg w-full max-w-sm p-5 space-y-3">
            <h3 className="text-lg font-semibold text-gray-900">
              {selectedStore.name || "매장 정보"}
            </h3>
            <div className="text-sm text-gray-700 space-y-1">
              <p>
                연결된 플랫폼: <PlatformList store={selectedStore} />
              </p>
              <p className="text-xs text-gray-500">
                자동 리포트: {selectedStore.autoReportEnabled ? "ON" : "OFF"}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={async () => {
                  const ok = confirm("매장과 관련 리뷰/리포트를 모두 삭제할까요?");
                  if (!ok || !selectedStore) return;
                  try {
                    await api.delete(`/store/${selectedStore.id}`);
                    setStores((prev) => prev.filter((st) => st.id !== selectedStore.id));
                    setShowStoreModal(false);
                  } catch {
                    alert("삭제에 실패했습니다. 다시 시도해주세요.");
                  }
                }}
                className="w-full py-2 rounded-lg bg-red-50 border border-red-100 text-sm text-red-600 active:scale-95"
              >
                매장 삭제
              </button>
              <button
                onClick={() => setShowStoreModal(false)}
                className="w-full py-2 rounded-lg bg-gray-100 text-sm text-gray-800 active:scale-95"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      <section className="bg-white rounded-2xl border border-gray-100 shadow-xs p-4 space-y-3">
        <div className="flex items-center justify-between text-sm font-semibold text-gray-800">
          <button
            onClick={() => setActiveTab("recent")}
            className={`px-2 py-1 text-base font-bold relative ${
              activeTab === "recent" ? "text-gray-900" : "text-gray-600"
            }`}
          >
            최근 1개월 리포트
            {activeTab === "recent" && (
              <span className="absolute left-0 right-0 -bottom-1 h-0.5 bg-blue-400/70 rounded-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("recurring")}
            className={`px-2 py-1 text-base font-bold relative ${
              activeTab === "recurring" ? "text-gray-900" : "text-gray-600"
            }`}
          >
            정기 리포트
            {activeTab === "recurring" && (
              <span className="absolute left-0 right-0 -bottom-1 h-0.5 bg-blue-400/70 rounded-full" />
            )}
          </button>
        </div>

        {activeTab === "recent" ? (
          <div className="space-y-2">
            {stores.length === 0 ? (
              <p className="text-sm text-gray-500">등록된 매장이 없습니다.</p>
            ) : (
              stores.map((s) => (
                <div
                  key={s.id}
                  className="border border-gray-100 rounded-xl p-3 bg-gray-50 shadow-md text-sm text-gray-800 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{s.name || "매장"}</p>
                      <button
                        aria-label="매장 정보"
                        onClick={() => {
                          setSelectedStore(s);
                          setShowStoreModal(true);
                        }}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <ChevronRightIcon className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-xs text-gray-600">
                      연결된 플랫폼:{" "}
                      {[
                        (s as any).naverPlaceId || (s as any).placeId ? "네이버" : null,
                        (s as any).googlePlaceId ? "구글" : null,
                        (s as any).kakaoPlaceId ? "카카오" : null,
                      ]
                        .filter(Boolean)
                        .join(" / ") || "없음"}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <button
                      onClick={() => router.push(`/dashboard?storeId=${s.id}`)}
                      className="w-full px-3 py-2 rounded-lg bg-white border border-gray-200 text-xs active:scale-95"
                    >
                      인사이트 확인하기
                    </button>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          if (
                            (user as any)?.subscriptionStatus === "active" &&
                            s.autoReportEnabled === true
                          ) {
                            router.push(`/reports/store/${s.id}`);
                          } else {
                            setSubscribingStore(s.id);
                            router.push(`/subscribe/product?storeId=${s.id}`);
                          }
                        }}
                        className="w-full px-3 py-2 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-700 active:scale-95"
                      >
                        정기 리포트 구독하기
                      </button>
                      <button
                        onClick={() => {
                          setScanStore(s);
                          setScanMessage(null);
                          setScanLogs([]);
                          setScanStatus(null);
                          setShowScanModal(true);
                        }}
                        className="w-full px-3 py-2 rounded-lg bg-white border border-gray-200 text-xs active:scale-95"
                      >
                        최신 리포트 스캔하기
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {(user as any)?.subscriptionStatus !== "active" ? (
              <div className="text-center space-y-3 py-4">
                <p className="text-sm text-gray-600">구독 중인 정기 리포트가 없습니다.</p>
                <button
                  onClick={() => router.push("/subscribe")}
                  className="w-full py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold active:scale-95"
                >
                  정기 리포트 구독하기
                </button>
              </div>
            ) : stores.filter((s) => s.autoReportEnabled === true).length === 0 ? (
              <div className="text-center space-y-3 py-4">
                <p className="text-sm text-gray-600">구독 중인 매장이 없습니다.</p>
                <button
                  onClick={() => router.push("/subscribe")}
                  className="w-full py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold active:scale-95"
                >
                  매장 정기 구독하기
                </button>
              </div>
            ) : (
              stores
                .filter((s) => s.autoReportEnabled === true)
                .map((s) => (
                  <button
                    key={s.id}
                    onClick={() => router.push(`/reports/store/${s.id}`)}
                    className="w-full text-left border border-gray-100 rounded-xl p-3 bg-white shadow-xs text-sm text-gray-800"
                  >
                    <p className="font-semibold">{s.name || "매장"}</p>
                    <p className="text-xs text-gray-600 mt-1">
                      연결된 플랫폼:{" "}
                      {[
                        (s as any).naverPlaceId || (s as any).placeId ? "네이버" : null,
                        (s as any).googlePlaceId ? "구글" : null,
                        (s as any).kakaoPlaceId ? "카카오" : null,
                      ]
                        .filter(Boolean)
                        .join(" / ") || "없음"}
                    </p>
                    <p className="text-[11px] text-gray-500">
                      자동리포트 {s.autoReportEnabled === false ? "OFF" : "ON"}
                    </p>
                  </button>
                ))
            )}
          </div>
        )}
      </section>

      <CollapsibleCard
        title="앱 설정"
        open={showSettings}
        onToggle={() => setShowSettings((v) => !v)}
      >
        <div className="space-y-2">
          <button
            onClick={() => router.push("/notifications/settings")}
            className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 text-sm"
          >
            알림 설정
          </button>
          <button
            onClick={() => router.push("/announcements")}
            className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 text-sm"
          >
            공지/이벤트 보기
          </button>
          <button
            onClick={() => router.push("/legal")}
            className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 text-sm"
          >
            약관 및 개인정보
          </button>
        </div>
      </CollapsibleCard>

      {showScanModal && (
        <div className="fixed inset-0 w-screen h-screen z-[9999] bg-black/40 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-lg w-full max-w-sm p-5 space-y-3">
            <h3 className="text-lg font-semibold text-gray-900">이용권 사용 안내</h3>
            <p className="text-sm text-gray-700">
              최신 리포트를 스캔하면 이용권 1개가 사용됩니다. 진행할까요?
            </p>
            <p className="text-xs text-gray-500">
              대상 매장: {scanStore?.name || "매장"} ({scanStore?.placeId || "placeId 없음"})
            </p>
            <p className="text-xs text-gray-500">
              현재 보유 이용권: {(user as any)?.extraCredits ?? 0}개
            </p>
            {scanMessage && <p className="text-xs text-red-500">{scanMessage}</p>}
            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={async () => {
                  const tokens = (user as any)?.extraCredits ?? 0;
                  if (!scanStore) return;
                  const pidNaver = scanStore.naverPlaceId || scanStore.placeId;
                  const pidGoogle = scanStore.googlePlaceId;
                  if (!pidNaver && !pidGoogle) {
                    setScanMessage("placeId가 없습니다. 채널을 다시 등록해주세요.");
                    return;
                  }
                  if (tokens < 10) {
                    setShowScanModal(false);
                    setShowChargeModal(true);
                    return;
                  }
                  setShowScanModal(false);
                  await runScanFlow(scanStore, pidNaver, pidGoogle);
                }}
                disabled={authLoading || scanLoading}
                className="w-full py-3 rounded-lg bg-blue-600 text-white text-sm font-semibold active:scale-95 disabled:opacity-60 text-base"
              >
                {scanLoading ? "수집 중..." : "이용권 사용하기"}
              </button>
            </div>
            <button
              onClick={() => {
                setScanMessage(null);
                setShowScanModal(false);
              }}
              className="w-full py-2 rounded-lg bg-gray-100 text-sm text-gray-700 active:scale-95"
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {showChargeModal && (
        <div className="fixed inset-0 w-screen h-screen z-[9999] bg-black/40 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-lg w-full max-w-sm p-5 space-y-3">
            <h3 className="text-lg font-semibold text-gray-900">충전이 필요합니다</h3>
            <p className="text-sm text-gray-700">보유 이용권이 부족합니다. 충전하시겠습니까?</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setShowChargeModal(false);
                  router.push("/credits");
                }}
                className="w-full py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold active:scale-95"
              >
                충전하기
              </button>
              <button
                onClick={() => setShowChargeModal(false)}
                className="w-full py-2 rounded-lg bg-gray-100 text-sm text-gray-700 active:scale-95"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {showScanProgress && (
        <div className="fixed inset-0 z-[9998] bg-black/30 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-5 space-y-3 text-center">
            <h3 className="text-lg font-semibold text-gray-900">
              {showScanProgress === "crawl" ? "리뷰 수집 중" : "분석/리포트 생성 중"}
            </h3>
            <p className="text-sm text-gray-700">{scanStatus || "진행 중입니다..."}</p>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 animate-pulse" />
            </div>
            <div className="text-left text-xs text-gray-600 space-y-1 bg-white/60 border rounded-xl p-3">
              <p>• {(scanLogs.length ? scanLogs[scanLogs.length - 1] : "진행 중...")}</p>
            </div>
            <p className="text-xs text-gray-500">
              잠시만 기다려주세요. 완료 시 자동으로 대시보드로 이동합니다.
            </p>
          </div>
        </div>
      )}

      <div className="flex justify-center pb-4">
        <button
          onClick={() => {
            logout();
            router.replace("/onboarding/intro");
          }}
          className="w-[200px] text-center px-3 py-3 rounded-full bg-red-100 text-red-700 font-semibold shadow-sm hover:bg-red-200 active:scale-95 text-sm"
        >
          로그아웃
        </button>
      </div>
    </div>
  );
}

function CollapsibleCard({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white rounded-2xl border border-gray-100 shadow-xs p-4">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between"
      >
        <h2 className="text-sm font-semibold text-gray-700">{title}</h2>
        <ChevronRightIcon
          className={`w-5 h-5 text-gray-400 transition-transform ${
            open ? "rotate-90" : ""
          }`}
        />
      </button>
      {open && (
        <div className="mt-3 pt-3 border-t border-gray-100 space-y-3">
          {children}
        </div>
      )}
    </section>
  );
}

function PlatformList({ store }: { store: Store }) {
  const platforms = [
    store.naverPlaceId || store.placeId ? "네이버" : null,
    store.googlePlaceId ? "구글" : null,
    store.kakaoPlaceId ? "카카오" : null,
  ]
    .filter(Boolean)
    .join(" / ");
  return <span>{platforms || "없음"}</span>;
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-gray-500">{label}</label>
      {children}
    </div>
  );
}
