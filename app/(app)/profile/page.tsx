"use client";

import { useEffect, useState } from "react";
import useAuthGuard from "@/app/hooks/useAuthGuard";
import useAuth from "@/app/hooks/useAuth";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const { loading: authLoading, user } = useAuthGuard();
  const { refresh } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [gender, setGender] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    setName(user?.name || "");
    setNickname(user?.nickname || "대표님");
    setGender(user?.gender || "");
    setAddress(user?.address || "");
    const hasProfile =
      (user?.name && user.name.trim() !== "") ||
      (user?.nickname && user.nickname.trim() !== "") ||
      (user?.gender && user.gender.trim() !== "") ||
      (user?.address && user.address.trim() !== "");
    setEditing(!hasProfile); // 정보가 비어 있으면 편집 모드로
  }, [user]);

  const handleSaveProfile = async () => {
    setSaving(true);
    setSaveMessage(null);
    try {
      await api.post("/auth/profile", { name, nickname, gender, address });
      await refresh();
      setSaveMessage("저장되었습니다.");
      setEditing(false);
    } catch {
      setSaveMessage("저장 실패. 값을 확인하세요.");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || !user) return <div className="p-6">로딩 중...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-sky-50 pt-[60px] pb-[90px] px-4 space-y-4 animate-fadeIn">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">내 정보 수정</h1>
        <button
          onClick={() => router.back()}
          className="text-xs text-blue-600 underline"
        >
          돌아가기
        </button>
      </div>

      <section className="bg-white rounded-2xl border border-gray-100 shadow-xs p-4 space-y-3">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <span>{editing ? "편집 모드" : "저장된 정보를 보고 있습니다"}</span>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="text-[11px] text-blue-600 underline"
            >
              수정하기
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 gap-3">
          <Field label="이름">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!editing}
              className="w-full border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 disabled:bg-gray-50 disabled:text-gray-500"
            />
          </Field>
          <Field label="닉네임">
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              disabled={!editing}
              className="w-full border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 disabled:bg-gray-50 disabled:text-gray-500"
            />
          </Field>
          <Field label="성별">
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              disabled={!editing}
              className="w-full border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 bg-white disabled:bg-gray-50 disabled:text-gray-500"
            >
              <option value="">선택 안 함</option>
              <option value="male">남성</option>
              <option value="female">여성</option>
              <option value="other">기타</option>
            </select>
          </Field>
          <Field label="주소">
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              disabled={!editing}
              className="w-full border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 disabled:bg-gray-50 disabled:text-gray-500"
            />
          </Field>
        </div>
        <button
          onClick={handleSaveProfile}
          disabled={saving || !editing}
          className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold text-sm active:scale-95 disabled:opacity-60"
        >
          {saving ? "저장 중..." : "저장하기"}
        </button>
        {saveMessage && <p className="text-xs text-gray-600">{saveMessage}</p>}
        {editing && (
          <button
            onClick={() => {
              setName(user?.name || "");
              setNickname(user?.nickname || "");
              setGender(user?.gender || "");
              setAddress(user?.address || "");
              setEditing(false);
            }}
            className="text-[11px] text-gray-500 underline"
          >
            변경 취소
          </button>
        )}
      </section>
    </div>
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
