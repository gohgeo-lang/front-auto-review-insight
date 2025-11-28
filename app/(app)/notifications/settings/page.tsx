"use client";

import { useEffect, useState } from "react";
import useAuthGuard from "@/app/hooks/useAuthGuard";

type PrefKey = "system" | "review" | "insight" | "marketing";
type Prefs = Record<PrefKey, boolean>;

export default function NotificationSettingsPage() {
  const { loading, user } = useAuthGuard();
  const [prefs, setPrefs] = useState<Prefs>({
    system: true,
    review: true,
    insight: true,
    marketing: false,
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("notification-prefs");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setPrefs((prev) => ({ ...prev, ...parsed }));
      } catch {
        // ignore broken storage
      }
    }
  }, []);

  const togglePref = (key: PrefKey) => {
    setPrefs((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem("notification-prefs", JSON.stringify(next));
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
      return next;
    });
  };

  if (loading || !user) return <div className="p-6">로딩 중...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-sky-50 pt-[60px] pb-[90px] px-4 space-y-4 animate-fadeIn">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">알림 설정</h1>
        {saved && <span className="text-[11px] text-blue-600">저장됨</span>}
      </div>
      <section className="bg-white rounded-2xl border border-gray-100 shadow-xs p-4 space-y-3">
        <p className="text-xs text-gray-500">
          채널별 알림을 켜거나 끌 수 있습니다.
        </p>
        <PrefRow
          label="시스템 알림"
          desc="로그인, 비밀번호 변경 등 계정 관련 알림"
          enabled={prefs.system}
          onToggle={() => togglePref("system")}
        />
        <PrefRow
          label="리뷰 수집 알림"
          desc="새 리뷰 도착, 수집 실패/완료 상태"
          enabled={prefs.review}
          onToggle={() => togglePref("review")}
        />
        <PrefRow
          label="인사이트 업데이트"
          desc="키워드/감성 리포트 생성·업데이트 알림"
          enabled={prefs.insight}
          onToggle={() => togglePref("insight")}
        />
        <PrefRow
          label="프로모션/공지"
          desc="새 기능, 이벤트, 이용 안내"
          enabled={prefs.marketing}
          onToggle={() => togglePref("marketing")}
        />
      </section>
    </div>
  );
}

function PrefRow({
  label,
  desc,
  enabled,
  onToggle,
}: {
  label: string;
  desc: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <div>
        <p className="text-sm font-semibold text-gray-800">{label}</p>
        <p className="text-xs text-gray-500">{desc}</p>
      </div>
      <button
        onClick={onToggle}
        className={`w-12 h-7 rounded-full transition-colors flex items-center px-1 ${
          enabled ? "bg-blue-600" : "bg-gray-300"
        }`}
        aria-pressed={enabled}
      >
        <span
          className={`h-5 w-5 bg-white rounded-full shadow-sm transition-transform ${
            enabled ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}
