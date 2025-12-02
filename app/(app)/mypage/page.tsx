"use client";

import { useEffect, useState } from "react";
import useAuthGuard from "@/app/hooks/useAuthGuard";
import useAuth from "@/app/hooks/useAuth";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";

type Store = {
  id: string;
  name?: string | null;
  placeId?: string | null;
  autoCrawlEnabled?: boolean;
  autoReportEnabled?: boolean;
};

export default function MyPage() {
  const { loading: authLoading, user } = useAuthGuard();
  const { logout } = useAuth();
  const router = useRouter();
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
          <div className="flex items-center justify-between text-sm text-gray-700">
            <div>
              <p className="text-xs text-gray-500">이용권 상태</p>
            <p className="text-sm font-semibold text-blue-700">
              {(user as any)?.subscriptionStatus === "active" ? "구독(유료)" : "무료 체험"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-gray-600">
              토큰 { (user as any)?.extraCredits ?? 0 }개 보유
            </span>
            <button
              onClick={() => router.push("/credits")}
              className="px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-800 active:scale-95"
            >
              충전하기
            </button>
          </div>
        </div>
      </section>

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
                    <div>
                      <p className="font-semibold">{s.name || "매장"}</p>
                      <p className="text-xs text-gray-600">placeId: {s.placeId || "-"}</p>
                    </div>
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
                          if ((user as any)?.subscriptionStatus === "active") {
                            router.push(`/reports/store/${s.id}`);
                          } else {
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
            ) : stores.length === 0 ? (
              <p className="text-sm text-gray-500">정기 발급 중인 매장이 없습니다.</p>
            ) : (
              stores.map((s) => (
                <button
                  key={s.id}
                  onClick={() => router.push(`/reports/store/${s.id}`)}
                  className="w-full text-left border border-gray-100 rounded-xl p-3 bg-white shadow-xs text-sm text-gray-800"
                >
                  <p className="font-semibold">{s.name || "매장"}</p>
                  <p className="text-xs text-gray-600 mt-1">연결된 플랫폼: 네이버</p>
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
            <h3 className="text-lg font-semibold text-gray-900">토큰 사용 안내</h3>
            <p className="text-sm text-gray-700">
              최신 리포트를 스캔하면 토큰 10개가 사용됩니다. 진행할까요?
            </p>
            <p className="text-xs text-gray-500">
              대상 매장: {scanStore?.name || "매장"} ({scanStore?.placeId || "placeId 없음"})
            </p>
            <p className="text-xs text-gray-500">
              현재 보유 토큰: {(user as any)?.extraCredits ?? 0}개
            </p>
            {scanMessage && <p className="text-xs text-red-500">{scanMessage}</p>}
            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={async () => {
                  const tokens = (user as any)?.extraCredits ?? 0;
                  if (!scanStore?.placeId) {
                    setScanMessage("placeId가 없습니다. 채널을 다시 등록해주세요.");
                    return;
                  }
                  if (tokens < 10) {
                    setShowScanModal(false);
                    setShowChargeModal(true);
                    return;
                  }
                  setScanLoading(true);
                  try {
                    const res = await api.post("/crawler/naver", {
                      placeId: scanStore.placeId,
                      storeId: scanStore.id,
                    });
                    setScanMessage(`수집 완료: ${res.data?.added ?? 0}개`);
                    setShowScanModal(false);
                  } catch (err: any) {
                    const code = err?.response?.data?.error;
                    if (code === "CREDITS_REQUIRED") {
                      setScanMessage("토큰이 부족합니다. 충전 후 이용해주세요.");
                    } else {
                      setScanMessage("수집 실패. placeId나 네트워크를 확인하세요.");
                    }
                  } finally {
                    setScanLoading(false);
                  }
                }}
                disabled={authLoading || scanLoading}
                className="w-full py-3 rounded-lg bg-blue-600 text-white text-sm font-semibold active:scale-95 disabled:opacity-60 text-base"
              >
                {scanLoading ? "수집 중..." : "토큰 사용하기"}
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
            <p className="text-sm text-gray-700">보유 토큰이 부족합니다. 충전하시겠습니까?</p>
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
