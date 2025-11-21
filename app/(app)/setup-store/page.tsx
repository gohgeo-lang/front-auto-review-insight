"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function SetupStorePage() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [message, setMessage] = useState("");
  const [placeId, setPlaceId] = useState("");
  const [loading, setLoading] = useState(false);

  // 이미 매장 등록된 유저면 redirect
  useEffect(() => {
    const userJson = localStorage.getItem("user");
    if (!userJson) return;
    const user = JSON.parse(userJson);

    if (user.placeId) router.push("/setup-store");
  }, []);

  // 1) URL → placeId 추출
  async function extractPlaceId() {
    setLoading(true);
    setMessage("");

    try {
      const res = await api.post("/store/extract", { url });
      setPlaceId(res.data.placeId);
      setMessage(`추출 성공! placeId: ${res.data.placeId}`);
    } catch (e) {
      setMessage("placeId를 추출할 수 없습니다. URL을 확인해주세요.");
    } finally {
      setLoading(false);
    }
  }

  // 2) placeId 저장 + 리뷰 자동 수집
  async function saveStore() {
    if (!placeId) return;

    setLoading(true);
    setMessage("");

    try {
      const userJson = localStorage.getItem("user");
      if (!userJson) return alert("로그인 정보 없음");

      const user = JSON.parse(userJson);

      const res = await api.post("/store/register-store", {
        userId: user.id,
        placeId,
      });

      user.placeId = placeId;
      localStorage.setItem("user", JSON.stringify(user));

      alert(`매장 등록 완료!\n리뷰 ${res.data.collected}개 수집.`);

      router.push("/dashboard");
    } catch (e) {
      setMessage("저장에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="px-4 py-8">
      <h1 className="text-2xl font-bold mb-3">매장 등록</h1>
      <p className="text-gray-600 text-sm leading-relaxed mb-6">
        네이버 지도에서 매장을 검색한 뒤, 매장 페이지의 URL을 아래에
        입력해주세요.
      </p>

      {/* URL 입력 */}
      <input
        type="text"
        placeholder="네이버 플레이스 URL 입력"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        className="w-full border rounded-xl px-4 py-3 text-base focus:ring-2 focus:ring-blue-400"
      />

      {/* placeId 추출 버튼 */}
      <button
        onClick={extractPlaceId}
        disabled={loading}
        className="w-full py-3 bg-blue-500 text-white rounded-xl font-semibold mt-3 button-active bg-blue-500 text-white py-2 px-4 rounded-lg"
      >
        {loading ? "추출 중..." : "URL에서 placeId 추출"}
      </button>

      {/* 결과 표시 */}
      {message && (
        <p
          className={`mt-3 text-sm ${
            placeId ? "text-green-600" : "text-red-500"
          }`}
        >
          {message}
        </p>
      )}

      {/* 저장하기 버튼 */}
      {placeId && (
        <button
          onClick={saveStore}
          disabled={loading}
          className="w-full py-3 bg-green-500 text-white rounded-xl font-semibold mt-6"
        >
          {loading ? "저장 중..." : "매장 등록하기"}
        </button>
      )}
    </div>
  );
}
