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

  // 이미 로그인된 사용자가 접근하면 대시보드로 자동 이동
  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/dashboard");
    }
  }, [authLoading, user, router]);

  async function handleLogin() {
    if (!email || !password) {
      alert("이메일과 비밀번호를 입력해주세요.");
      return;
    }

    setLoading(true);

    try {
      const res = await api.post("/auth/login", { email, password });

      // AuthContext에 로그인 반영
      login(res.data.token, res.data.user);

      router.push("/dashboard");
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
      <p className="text-gray-600 text-sm mb-6">
        리뷰 관리를 AI가 대신해드립니다.
      </p>

      <div className="space-y-4">
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
          {loading ? "로그인 중..." : "로그인"}
        </button>
      </div>

      <div className="text-center mt-6 space-y-2">
        <p
          onClick={() => router.push("/auth/register")}
          className="text-sm text-gray-600 cursor-pointer"
        >
          아직 계정이 없으신가요?{" "}
          <span className="text-blue-500 font-medium">회원가입</span>
        </p>

        <p className="text-xs text-gray-500 underline cursor-pointer">
          아이디 또는 비밀번호를 잊으셨나요?
        </p>
      </div>
    </div>
  );
}
