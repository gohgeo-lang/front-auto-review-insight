"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import useAuth from "@/app/hooks/useAuth";
import { api } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <div className="px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">회원가입</h1>
      <p className="text-gray-600 text-sm mb-6">
        네이버/구글 로그인이 기본이며, 관리자/개발자용 계정만 여기서 이메일/비밀번호로 생성하세요.
      </p>

      <div className="space-y-4">
        <input
          type="email"
          placeholder="관리자 이메일"
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
          onClick={async () => {
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
              const res = await api.post("/auth/signup", { email, password });
              const { token, user } = res.data;
              login(token, user);
              router.push("/home");
            } catch {
              alert("회원가입 실패. 이미 존재하는 이메일일 수 있습니다.");
            } finally {
              setLoading(false);
            }
          }}
          disabled={loading}
          className="w-full py-3 bg-blue-500 text-white rounded-xl font-semibold active:scale-95 transition"
        >
          {loading ? "가입 중..." : "관리자 계정 생성"}
        </button>
      </div>

      <div className="text-center mt-6 space-y-2">
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
