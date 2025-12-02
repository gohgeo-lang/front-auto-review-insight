"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import useAuth from "@/app/hooks/useAuth";

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (!email || !password || !password2) {
      alert("모든 필드를 입력해주세요.");
      return;
    }

    if (password !== password2) {
      alert("비밀번호가 일치하지 않습니다.");
      return;
    }

    setLoading(true);

    try {
      const res = await api.post("/auth/signup", {
        email,
        password,
      });

      const { token, user } = res.data;
      login(token, user);
      router.push("/home");
    } catch (e: any) {
      alert("회원가입 실패. 이미 존재하는 이메일일 수 있습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">회원가입</h1>
      <p className="text-gray-600 text-sm mb-6">
        간단한 정보 입력으로 바로 시작할 수 있어요.
      </p>

      <div className="space-y-4">
        <input
          type="email"
          placeholder="이메일 주소"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-400 focus:outline-none"
        />

        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-400 focus:outline-none"
        />

        <input
          type="password"
          placeholder="비밀번호 확인"
          value={password2}
          onChange={(e) => setPassword2(e.target.value)}
          className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-400 focus:outline-none"
        />

        <button
          onClick={handleRegister}
          disabled={loading}
          className="w-full py-3 bg-blue-500 text-white rounded-xl font-semibold "
        >
          {loading ? "가입 중..." : "회원가입"}
        </button>
      </div>

      <div className="text-center mt-6">
        <p
          onClick={() => router.push("/auth/login")}
          className="text-sm text-gray-600 cursor-pointer"
        >
          이미 계정이 있으신가요?{" "}
          <span className="text-blue-500 font-medium">로그인</span>
        </p>
      </div>
    </div>
  );
}
