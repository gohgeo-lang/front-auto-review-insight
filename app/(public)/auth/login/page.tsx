"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import useAuth from "@/app/hooks/useAuth";

export default function LoginPage() {
  const router = useRouter();
  const { user, login, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // 이미 로그인된 사용자가 접근하면 홈으로 이동
  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/home");
    }
  }, [authLoading, user, router]);

  async function handleLogin() {
    if (!email || !password) {
      alert("관리자 계정이 없다면 관리자용 회원가입으로 이동합니다.");
      router.push("/auth/register");
      return;
    }

    setLoading(true);

    try {
      const res = await api.post("/auth/login", { email, password });

      // AuthContext에 로그인 반영
      login(res.data.token, res.data.user);

      router.push("/home");
    } catch (e: any) {
      alert("로그인 실패. 이메일 또는 비밀번호를 확인해주세요.");
    } finally {
      setLoading(false);
    }
  }

  // AuthContext 초기 로딩 동안 깜빡임 방지
  if (authLoading) {
    return <div className="p-8 text-center">불러오는 중...</div>;
  }

  return (
    <div className="px-4 py-8 animate-fadeIn">
      <h1 className="text-2xl font-bold mb-2">로그인</h1>
      <p className="text-gray-600 text-sm mb-6">EMILY에서 고객반응을 분석해보세요.</p>

      <div className="space-y-3">
        <button
          onClick={() => alert("네이버 로그인 연동 예정입니다.")}
          className="w-full py-3 bg-green-500 text-white rounded-xl font-semibold text-sm active:scale-95"
        >
          네이버로 로그인
        </button>
        <button
          onClick={() => alert("구글 로그인 연동 예정입니다.")}
          className="w-full py-3 bg-red-500 text-white rounded-xl font-semibold text-sm active:scale-95"
        >
          구글로 로그인
        </button>
      </div>

      <div className="mt-6 border-t pt-4 space-y-2">
        <p className="text-xs text-gray-500 font-semibold">개발자/관리자용 테스트 로그인</p>
        <div className="space-y-3">
          <input
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-base"
          />
          <input
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-base"
          />
          <button
            onClick={handleLogin}
            disabled={loading}
            className="btn-primary w-full active:scale-95 transition"
          >
            {loading ? "로그인 중..." : "관리자 로그인"}
          </button>
        </div>
      </div>

    </div>
  );
}
