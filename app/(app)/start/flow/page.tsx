"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";

type Step = 0 | 1 | 2 | 3 | 4;
export default function StartFlow() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(0);
  const [placeId, setPlaceId] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [url, setUrl] = useState("");
  const [logs, setLogs] = useState<string[]>([]);

  const next = () => {
    setStep((s) => ((s + 1) as Step));
  };

  async function extractPlaceId() {
    if (!url) return alert("URL을 입력하세요.");
    setLoading(true);
    setStatus("placeId 추출 중...");
    try {
      const res = await api.post("/store/extract", { url });
      setPlaceId(res.data.placeId);
      setStatus(`placeId 추출 성공: ${res.data.placeId}`);
    } catch (err: any) {
      setStatus("placeId 추출 실패. URL을 확인하세요.");
    } finally {
      setLoading(false);
    }
  }

  async function saveChannel() {
    if (!placeId) return alert("placeId를 입력하세요.");
    setLoading(true);
    setStatus("채널 저장 중...");
    try {
      await api.post("/store/register-store", { placeId });
      setStatus("채널이 저장되었습니다.");
      next();
    } catch (err: any) {
      const msg =
        err?.response?.data?.error || "채널 저장 실패. placeId를 확인하세요.";
      setStatus(msg);
    } finally {
      setLoading(false);
    }
  }

  async function runCrawl() {
    setLoading(true);
    setStatus("수집 중...");
    setLogs(["수집 중..."]);
    try {
      const res = await api.post("/crawler/naver", { placeId });
      const addedMsg = `수집 완료: ${res.data?.added ?? 0}개`;
      const logArr: string[] = res.data?.logs || [];
      const finalLogs = logArr.length ? logArr : [addedMsg];
      setLogs(finalLogs);
      setStatus(finalLogs[finalLogs.length - 1] || addedMsg);
      next();
    } catch (err) {
      setStatus("수집 실패. placeId나 네트워크를 확인하세요.");
      setLogs((prev) => [...(prev.length ? prev : ["수집 중..."]), "수집 실패"]);
    } finally {
      setLoading(false);
    }
  }

  async function runAnalysis() {
    setLoading(true);
    setStatus("AI 분석 중...");
    try {
      await api.post("/ai/summary/missing");
      // 온보딩 완료 플래그
      try {
        await api.post("/auth/complete-onboarding");
      } catch (err) {
        // ignore
      }
      const userJson = localStorage.getItem("user");
      if (userJson) {
        try {
          const parsed = JSON.parse(userJson);
          if (parsed?.id) {
            localStorage.setItem(`onboarded:${parsed.id}`, "true");
            parsed.onboarded = true;
            localStorage.setItem("user", JSON.stringify(parsed));
          }
        } catch {
          localStorage.setItem("onboarded", "true");
        }
      } else {
        localStorage.setItem("onboarded", "true");
      }
      setStatus("분석 완료! 대시보드로 이동할 수 있습니다.");
      next();
    } catch (err: any) {
      const code = err?.response?.data?.error;
      if (code === "OPENAI_QUOTA_EXCEEDED") {
        setStatus("분석 실패: AI 쿼터를 확인하세요.");
      } else {
        setStatus("분석 실패. 잠시 후 다시 시도해주세요.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50 px-6 py-10 space-y-6">
      <header className="flex items-center justify-between">
        <div className="text-sm font-bold text-blue-700">RIB</div>
        <div className="text-xs text-gray-500">Step {step + 1}/5</div>
      </header>

      {step === 0 && (
        <div className="space-y-4">
          <h1 className="text-2xl font-bold">RIB 시작하기</h1>
          <p className="text-sm text-gray-700">
            채널을 연결하고, 리뷰를 수집/분석한 뒤 대시보드로 이동하세요.
          </p>
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-2 text-sm text-gray-700">
            <p>1) 채널 연결: 네이버 placeId 등록</p>
            <p>2) 리뷰 수집: 버튼 한 번으로 최신 리뷰 모으기</p>
            <p>3) AI 분석: 감성/키워드 리포트 생성</p>
            <p>4) 완료 후 대시보드 확인</p>
          </div>
          <button
            onClick={next}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold text-sm"
          >
            시작하기
          </button>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-3">
          <h1 className="text-xl font-bold">채널 연결</h1>
          <p className="text-sm text-gray-700">
            placeId를 등록해 채널을 연결하세요. (네이버 필수)
          </p>
          <input
            type="text"
            placeholder="네이버 플레이스 URL 입력"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-400"
          />
          <button
            onClick={extractPlaceId}
            disabled={loading}
            className="w-full py-3 bg-blue-50 text-blue-700 rounded-xl font-semibold text-sm border border-blue-100"
          >
            {loading ? "추출 중..." : "URL에서 placeId 추출"}
          </button>
          <input
            type="text"
            placeholder="네이버 placeId 입력"
            value={placeId}
            onChange={(e) => setPlaceId(e.target.value)}
            className="w-full border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-400"
          />
          <button
            onClick={saveChannel}
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold text-sm"
          >
            {loading ? "저장 중..." : "채널 저장"}
          </button>
          {status && <p className="text-xs text-gray-600">{status}</p>}
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3">
          <h1 className="text-xl font-bold">리뷰 수집</h1>
          <p className="text-sm text-gray-700">
            등록된 placeId로 리뷰를 수집합니다.
          </p>
          <button
            onClick={runCrawl}
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold text-sm"
          >
            {loading ? "수집 중..." : "수집 시작"}
          </button>
          {status && <p className="text-xs text-gray-600">{status}</p>}
          {logs.length > 0 && (
            <div className="text-xs text-gray-600 space-y-1 bg-white/60 border rounded-xl p-3">
              {logs.map((l, i) => (
                <p key={i}>• {l}</p>
              ))}
            </div>
          )}
        </div>
      )}

      {step === 3 && (
        <div className="space-y-3">
          <h1 className="text-xl font-bold">AI 분석</h1>
          <p className="text-sm text-gray-700">
            수집된 리뷰를 분석하여 인사이트 리포트를 준비합니다.
          </p>
          <button
            onClick={runAnalysis}
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold text-sm"
          >
            {loading ? "분석 중..." : "분석 실행"}
          </button>
          {status && <p className="text-xs text-gray-600">{status}</p>}
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4 text-center">
          <h1 className="text-2xl font-bold">완료!</h1>
          <p className="text-sm text-gray-700">
            수집과 분석이 완료되었습니다. 대시보드에서 결과를 확인하세요.
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="w-full py-3 bg-green-600 text-white rounded-xl font-semibold text-sm"
          >
            대시보드로 이동
          </button>
        </div>
      )}
    </div>
  );
}
