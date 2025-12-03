"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import useAuthGuard from "@/app/hooks/useAuthGuard";
import useAuth from "@/app/hooks/useAuth";

type Step = 0 | 1 | 2 | 3 | 4;
export default function StartFlow() {
  const { user, loading: authLoading } = useAuthGuard();
  const { refresh } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<Step>(0);
  const [platform, setPlatform] = useState<"naver" | "google" | "kakao">("naver");
  const [placeId, setPlaceId] = useState("");
  const [storeId, setStoreId] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [url, setUrl] = useState("");
  const [logs, setLogs] = useState<string[]>([]);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const requiredTokens = 10;

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
      const res = await api.post("/store/register-store", { placeId });
      setStoreId(res.data?.store?.id || "");
      const fetchedName = res.data?.store?.name;
      setStatus(
        fetchedName
          ? `채널 저장 완료: ${fetchedName}`
          : "채널이 저장되었습니다. 다음 단계로 진행하세요."
      );
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
      const res = await api.post("/crawler/naver", { placeId, storeId });
      const added = res.data?.added ?? 0;
      const rangeDays = res.data?.rangeDays;
      const limitedBy = res.data?.limitedBy;
      const rangeText = rangeDays ? `${rangeDays}일` : "전체";
      const limitText = limitedBy?.startsWith("days_") ? `(범위 ${rangeText})` : "";
      const addedMsg = `수집 완료: ${added}개 ${limitText}`.trim();
      const logArr: string[] = res.data?.logs || [];
      const metaLog = `범위: ${rangeText}, 최대 300개 적용`;
      const finalLogs = logArr.length ? [...logArr, metaLog] : [addedMsg, metaLog];
      setLogs(finalLogs);
      setStatus(finalLogs[finalLogs.length - 1] || addedMsg);
      if (refresh) await refresh();
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
    setStatus("1차 분석(요약) 중...");
    try {
      await api.post("/ai/summary/missing", { storeId });
      if (refresh) await refresh();
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
      setStatus("1차 분석 완료! 리포트 생성은 완료 후 버튼으로 진행하세요.");
      next();
    } catch (err: any) {
      const code = err?.response?.data?.error;
      if (code === "OPENAI_QUOTA_EXCEEDED") {
        setStatus("분석 실패: 쿼터를 확인하세요.");
      } else {
        setStatus("분석 실패. 잠시 후 다시 시도해주세요.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function runFinalReportAndGo() {
    setLoading(true);
    setStatus("인사이트 리포트 생성 중...");
    try {
      // 2차 리포트용 배치 요약 생성
      await api.post("/ai/summary/batch", { storeId });
      await api.post("/ai/insight/report", { storeId });
      if (refresh) await refresh();
      setStatus("리포트 생성 완료! 대시보드로 이동합니다.");
      router.push("/dashboard");
    } catch (err: any) {
      const code = err?.response?.data?.error;
      if (code === "NO_BATCH_SUMMARIES") {
        setStatus("리뷰가 부족해 리포트를 만들 수 없습니다. 리뷰를 수집 후 다시 시도하세요.");
      } else if (code === "OPENAI_QUOTA_EXCEEDED") {
        setStatus("리포트 생성 실패: OpenAI 쿼터를 확인하세요.");
      } else {
        setStatus("리포트 생성 실패. 잠시 후 다시 시도해주세요.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50 px-6 py-10 space-y-6">
      <header className="flex items-center justify-between">
        <div className="text-sm font-bold text-blue-700">EMILY</div>
        <div className="text-xs text-gray-500">Step {step + 1}/5</div>
      </header>

      {step === 0 && (
        <div className="space-y-4">
          <h1 className="text-2xl font-bold">EMILY 시작하기</h1>
          <p className="text-sm text-gray-700">
            채널을 연결하고, 리뷰를 수집/분석한 뒤 대시보드로 이동하세요.
          </p>
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-2 text-sm text-gray-700">
            <p>1) 채널 연결: 네이버 placeId 등록</p>
            <p>2) 리뷰 수집: 버튼 한 번으로 최신 리뷰 모으기</p>
            <p>3) 분석: 감성/키워드 리포트 생성</p>
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
            채널을 선택해 placeId를 등록하세요. (현재 네이버만 지원)
          </p>
          <div className="space-y-3">
            <div className="p-4 border rounded-xl bg-white shadow-xs space-y-2">
              <label className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={platform === "naver"}
                    onChange={() => setPlatform("naver")}
                  />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">네이버 플레이스</p>
                    <p className="text-xs text-gray-600">URL을 넣어 placeId를 추출하고 저장하세요.</p>
                  </div>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                  필수
                </span>
              </label>
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
            </div>

            <div className="p-4 border rounded-xl bg-white shadow-xs space-y-1 opacity-60">
              <label className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-gray-900">구글 지도</p>
                  <p className="text-xs text-gray-600">준비 중입니다.</p>
                </div>
                <input type="radio" disabled />
              </label>
            </div>

            <div className="p-4 border rounded-xl bg-white shadow-xs space-y-1 opacity-60">
              <label className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-gray-900">카카오맵</p>
                  <p className="text-xs text-gray-600">준비 중입니다.</p>
                </div>
                <input type="radio" disabled />
              </label>
            </div>

            <button
              onClick={saveChannel}
              disabled={loading || platform !== "naver"}
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold text-sm disabled:opacity-60"
            >
              {loading ? "저장 중..." : "채널 저장"}
            </button>
          </div>
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
            onClick={() => setShowTokenModal(true)}
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
          <h1 className="text-xl font-bold">분석</h1>
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
            수집과 1차 분석이 완료되었습니다. 리포트를 생성하거나 바로 대시보드로 이동하세요.
          </p>
          <div className="space-y-2">
            <button
              onClick={runFinalReportAndGo}
              disabled={loading}
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold text-sm disabled:opacity-60"
            >
              {loading ? "리포트 생성 중..." : "리포트 확인하기"}
            </button>
          </div>
        </div>
      )}

      {showTokenModal && (
        <div className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-lg w-full max-w-sm p-5 space-y-3">
            <h3 className="text-lg font-semibold text-gray-900">토큰 사용 안내</h3>
            <p className="text-sm text-gray-700">
              리뷰 수집/분석을 시작하면 토큰 {requiredTokens}개가 사용됩니다.
            </p>
            <p className="text-xs text-gray-500">
              현재 보유 토큰: {(user as any)?.extraCredits ?? 0}개
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  const tokens = (user as any)?.extraCredits ?? 0;
                  if (tokens < requiredTokens) {
                    setStatus("토큰이 부족합니다. 충전 후 이용해주세요.");
                    setShowTokenModal(false);
                    router.push("/credits");
                    return;
                  }
                  runCrawl();
                }}
                disabled={authLoading || loading}
                className="w-full py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold active:scale-95 disabled:opacity-60"
              >
                사용하기
              </button>
              <button
                onClick={() => {
                  setShowTokenModal(false);
                  router.push("/credits");
                }}
                className="w-full py-2 rounded-lg bg-white border border-gray-200 text-sm text-gray-800 active:scale-95"
              >
                충전하기
              </button>
            </div>
            <button
              onClick={() => setShowTokenModal(false)}
              className="w-full py-2 rounded-lg bg-gray-100 text-sm text-gray-700 active:scale-95"
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
