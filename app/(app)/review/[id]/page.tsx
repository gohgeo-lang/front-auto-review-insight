"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import useAuthGuard from "@/app/hooks/useAuthGuard";
import { useParams, useRouter } from "next/navigation";

export default function ReviewDetail() {
  const { id } = useParams();
  const reviewId = String(id);
  const router = useRouter();

  // 로그인 보호
  const { loading: authLoading, user } = useAuthGuard();

  const [review, setReview] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [reply, setReply] = useState("");
  const [generatedReply, setGeneratedReply] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [allReviews, setAllReviews] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);

  const prevReview = currentIndex > 0 ? allReviews[currentIndex - 1] : null;
  const nextReview =
    currentIndex < allReviews.length - 1 ? allReviews[currentIndex + 1] : null;

  // =============================
  // 데이터 로딩 함수
  // =============================
  const loadData = useCallback(async () => {
    if (!id) return;

    try {
      setError(null);
      // 전체 리뷰 목록
      const list = await api.get("/reviews");
      setAllReviews(list.data);

      const index = list.data.findIndex(
        (r: any) => r.id === reviewId || r.reviewId === reviewId
      );
      setCurrentIndex(index);

      // 현재 리뷰 데이터
      const rvResp = await api.get(`/reviews/${reviewId}`).catch(async () => {
        const found = list.data.find(
          (r: any) => r.reviewId === reviewId || r.id === reviewId
        );
        if (found?.id) {
          return api.get(`/reviews/${found.id}`);
        }
        return null;
      });

      if (!rvResp?.data) {
        setError("리뷰를 찾을 수 없습니다.");
        return;
      }

      setReview(rvResp.data);

      // 요약
      const sm = await api.get(`/summary/${rvResp.data.id}`).catch(() => null);
      setSummary(sm?.data || null);

      // 응답문
      const rp = await api.get(`/reply/${rvResp.data.id}`).catch(() => null);
      if (rp?.data) {
        setGeneratedReply(rp.data.content);
        setReply(rp.data.content);
      }
    } catch (err) {
      console.error("리뷰 상세 로딩 실패:", err);
    }
  }, [id]);

  useEffect(() => {
    if (!authLoading && user) loadData();
  }, [authLoading, user, id, loadData]);

  if (authLoading || !user) {
    return <div className="p-8 text-center text-gray-500">불러오는 중...</div>;
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-500">
        {error}
      </div>
    );
  }

  if (!review) {
    return <div className="p-8 text-center text-gray-500">리뷰가 없습니다.</div>;
  }

  // =============================
  // 요약 생성
  // =============================
  async function generateSummary() {
    setLoading(true);
    try {
      const res = await api.post("/ai/summary", {
        reviewId,
        content: review.content,
      });
      setSummary(res.data);
    } finally {
      setLoading(false);
    }
  }

  // =============================
  // 응대문 저장
  // =============================
  async function saveReply(text: string) {
    await api.post("/reply", {
      reviewId: id,
      content: text,
      tone: "기본",
    });
  }

  // =============================
  // 응대문 생성
  // =============================
  async function generateReply() {
    setLoading(true);
    try {
      const res = await api.post("/ai/reply", {
        reviewId,
        content: review.content,
        tone: "기본",
      });
      const text = res.data.reply;
      setGeneratedReply(text);
      setReply(text);
      await saveReply(text);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#fafafa] pb-28 pt-[70px] animate-fadeIn mobile-container">
      {/* ======================= */}
      {/* 리뷰 본문 */}
      {/* ======================= */}
      <div className="bg-white border rounded-xl shadow-sm p-4 mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-500">
            {review.platform}
          </span>
          <span className="text-sm bg-yellow-300 px-2 py-1 rounded-md">
            ⭐ {review.rating}
          </span>
        </div>

        <p className="text-gray-800 whitespace-pre-line leading-relaxed">
          {review.content}
        </p>

        <p className="text-xs text-gray-400 mt-3">
          {review.createdAt?.slice(0, 10)}
        </p>
      </div>

      {/* ======================= */}
      {/* 요약 */}
      {/* ======================= */}
      <div className="bg-white border rounded-xl shadow-sm p-4 mb-4">
        <h2 className="text-lg font-bold mb-3">요약</h2>

        {summary ? (
          <div className="space-y-4 text-sm">
            {summary.positives?.length > 0 && (
              <div>
                <p className="font-semibold mb-1">👍 긍정 요약</p>
                <ul className="list-disc pl-5 space-y-1">
                  {summary.positives.map((p: string, i: number) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              </div>
            )}

            {summary.negatives?.length > 0 && (
              <div>
                <p className="font-semibold mb-1">👎 부정 요약</p>
                <ul className="list-disc pl-5 space-y-1">
                  {summary.negatives.map((p: string, i: number) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              </div>
            )}

            {summary.insights?.length > 0 && (
              <div>
                <p className="font-semibold mb-1">💡 인사이트</p>
                <ul className="list-disc pl-5 space-y-1">
                  {summary.insights.map((p: string, i: number) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={generateSummary}
            disabled={loading}
            className="w-full bg-blue-500 text-white py-2 rounded-lg active:scale-95 transition"
          >
            {loading ? "생성 중..." : "요약 생성"}
          </button>
        )}
      </div>

      {/* ======================= */}
      {/* 응대문 */}
      {/* ======================= */}
      <div className="bg-white border rounded-xl shadow-sm p-4 mb-24">
        <h2 className="text-lg font-bold mb-3">자동 응대문</h2>

        {generatedReply ? (
          <p className="text-gray-800 whitespace-pre-line leading-relaxed">
            {generatedReply}
          </p>
        ) : (
          <button
            onClick={generateReply}
            disabled={loading}
            className="w-full bg-green-500 text-white py-2 rounded-lg active:scale-95 transition"
          >
            {loading ? "생성 중..." : "응대문 생성"}
          </button>
        )}
      </div>

      {/* ======================= */}
      {/* 리뷰 이동 버튼 (이전/다음) */}
      {/* ======================= */}
      <div className="fixed bottom-[70px] left-0 right-0 flex justify-between px-5 pointer-events-none">
        <button
          disabled={!prevReview}
          onClick={() => router.push(`/review/${prevReview.id}`)}
          className={`pointer-events-auto px-4 py-2 rounded-full shadow-md text-sm font-medium ${
            prevReview ? "bg-white" : "bg-gray-300 text-gray-400"
          }`}
        >
          ← 이전
        </button>

        <button
          disabled={!nextReview}
          onClick={() => router.push(`/review/${nextReview.id}`)}
          className={`pointer-events-auto px-4 py-2 rounded-full shadow-md text-sm font-medium ${
            nextReview ? "bg-white" : "bg-gray-300 text-gray-400"
          }`}
        >
          다음 →
        </button>
      </div>

      {/* ======================= */}
      {/* 응답문 입력 + 저장 */}
      {/* ======================= */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-sm p-3 flex gap-2 safe-bottom">
        <input
          type="text"
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          placeholder="응대문을 수정하거나 메모를 적어보세요..."
          className="flex-1 border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
        />

        <button
          onClick={async () => {
            setGeneratedReply(reply);
            await saveReply(reply);
          }}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 rounded-lg font-medium active:scale-95 transition"
        >
          저장
        </button>
      </div>

      {/* ======================= */}
      {/* 키워드 태그 */}
      {/* ======================= */}
      {summary?.tags?.length > 0 && (
        <div className="bg-white border rounded-xl shadow-sm p-4 mb-4 slide-up">
          <h3 className="text-sm font-semibold mb-2">키워드 태그</h3>
          <div className="flex gap-2 flex-wrap">
            {summary.tags.map((tag: string, i: number) => (
              <span
                key={i}
                className="px-3 py-1 text-xs bg-blue-50 text-blue-600 rounded-full border border-blue-200"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
