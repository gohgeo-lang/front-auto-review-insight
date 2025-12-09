"use client";

import { useEffect, useState } from "react";
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
  const [naverPlaceId, setNaverPlaceId] = useState("");
  const [googlePlaceId, setGooglePlaceId] = useState("");
  const [kakaoPlaceId, setKakaoPlaceId] = useState("");
  const [naverUrl, setNaverUrl] = useState("");
  const [googleUrl, setGoogleUrl] = useState("");
  const [kakaoUrl, setKakaoUrl] = useState("");
  const [storeId, setStoreId] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [showTokenModal, setShowTokenModal] = useState(false);
  // 미사용 상태값 정리
  // const [crawlPlatform, setCrawlPlatform] = useState<"both" | "kakao">("both");
  const requiredTokens = 1; // 이용권 1회
  const [showProgressModal, setShowProgressModal] = useState<
    null | "crawl" | "analysis"
  >(null);

  const next = () => {
    setStep((s) => (s + 1) as Step);
  };

  // 크레딧 결제 후 돌아온 경우 토큰 모달 재오픈
  useEffect(() => {
    const resume = localStorage.getItem("resumeTokenModal");
    const resumeStep = localStorage.getItem("resumeStep");
    if (resume === "true") {
      if (resumeStep) {
        const stepNum = Number(resumeStep);
        if (!Number.isNaN(stepNum) && stepNum >= 0 && stepNum <= 4) {
          setStep(stepNum as Step);
        }
      }
      setShowTokenModal(true);
      localStorage.removeItem("resumeTokenModal");
      localStorage.removeItem("resumeStep");
    }
  }, []);

  async function extractPlaceId() {
    if (!naverUrl) return alert("URL을 입력하세요.");
    setLoading(true);
    setStatus("placeId 추출 중...");
    try {
      const res = await api.post("/store/extract", { url: naverUrl });
      const provider = res.data?.provider;
      const pid = res.data.placeId;
      if (provider === "google") {
        setGooglePlaceId(pid);
      } else if (provider === "kakao") {
        setKakaoPlaceId(pid);
      } else {
        setNaverPlaceId(pid);
      }
      setStatus(`placeId 추출 성공: ${pid} (${provider || "naver"})`);
    } catch (err: unknown) {
      setStatus("placeId 추출 실패. URL을 확인하세요.");
    } finally {
      setLoading(false);
    }
  }

  async function saveChannel() {
    if (!naverPlaceId && !googlePlaceId && !kakaoPlaceId)
      return alert("URL에서 placeId를 추출한 뒤 저장해주세요.");
    setLoading(true);
    setStatus("채널 저장 중...");
    try {
      const res = await api.post("/store/register-store", {
        placeId: naverPlaceId || googlePlaceId,
        naverPlaceId,
        googlePlaceId,
        kakaoPlaceId,
        naverUrl,
        googleUrl,
        kakaoUrl,
      });
      setStoreId(res.data?.store?.id || "");
      const fetchedName = res.data?.store?.name;
      setStatus(
        fetchedName
          ? `채널 저장 완료: ${fetchedName}`
          : "채널이 저장되었습니다. 다음 단계로 진행하세요."
      );
      next();
    } catch (err: unknown) {
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
    setShowProgressModal("crawl");
    try {
      // 저장된 store에 placeId가 있다면 상태를 보강 (사용자가 새로고침 등으로 state가 비었을 때 대비)
      if (storeId && (!naverPlaceId || !googlePlaceId)) {
        try {
          const res = await api.get("/store");
          const found = (res.data || []).find(
            (s: {
              id: string;
              naverPlaceId?: string;
              googlePlaceId?: string;
              kakaoPlaceId?: string;
            }) => s.id === storeId
          );
          if (found) {
            if (!naverPlaceId && found.naverPlaceId)
              setNaverPlaceId(found.naverPlaceId);
            if (!googlePlaceId && found.googlePlaceId)
              setGooglePlaceId(found.googlePlaceId);
          }
        } catch {
          // ignore
        }
      }

      const newLogs: string[] = [];

      if (!naverPlaceId && !googlePlaceId && !kakaoPlaceId) {
        setStatus("placeId가 없습니다. 채널을 먼저 저장하세요.");
        setShowProgressModal(null);
        setLoading(false);
        return;
      }
      if (!googlePlaceId)
        newLogs.push("[구글] place_id/cid가 없어 구글 수집을 건너뜁니다.");
      if (!kakaoPlaceId)
        newLogs.push("[카카오] place_id가 없어 카카오 수집을 건너뜁니다.");

      const runSingle = async (
        endpoint: string,
        pid: string,
        label: string,
        skipCharge?: boolean
      ) => {
        if (!pid) return;
        const res = await api.post(endpoint, {
          placeId: pid,
          storeId,
          skipCharge,
        });
        const added = (res.data?.added as number) ?? 0;
        const rangeDays = res.data?.rangeDays as number | undefined;
        const limitedBy = res.data?.limitedBy as string | undefined;
        const rangeText = rangeDays ? `${rangeDays}일` : "전체";
        const limitText = limitedBy?.startsWith("days_")
          ? `(범위 ${rangeText})`
          : "";
        const addedMsg = `[${label}] 수집 완료: ${added}개 ${limitText}`.trim();
        const logArr: string[] = (res.data?.logs as string[]) || [];
        const metaLog = `[${label}] 범위: ${rangeText}, 최대 300개 적용`;
        newLogs.push(
          ...(logArr.length
            ? logArr.map((l) => `[${label}] ${l}`)
            : [addedMsg]),
          metaLog
        );
      };

      const targets: Array<["naver" | "google" | "kakao", string]> = [];
      if (naverPlaceId) targets.push(["naver", naverPlaceId]);
      if (googlePlaceId) targets.push(["google", googlePlaceId]);
      if (kakaoPlaceId) targets.push(["kakao", kakaoPlaceId]);

      let charged = false;
      for (const [platformName, pid] of targets) {
        const endpoint =
          platformName === "google"
            ? "/crawler/google"
            : platformName === "kakao"
            ? "/crawler/kakao"
            : "/crawler/naver";
        await runSingle(
          endpoint,
          pid,
          platformName === "google"
            ? "구글"
            : platformName === "kakao"
            ? "카카오"
            : "네이버",
          charged // 두 번째 이후 호출은 skipCharge=true
        );
        charged = true;
      }

      setLogs(newLogs.length ? newLogs : ["수집 완료"]);
      setStatus(newLogs[newLogs.length - 1] || "수집 완료");
      if (refresh) await refresh();
      next();
    } catch (err: unknown) {
      setStatus("수집 실패. placeId나 네트워크를 확인하세요.");
      setLogs((prev) => [
        ...(prev.length ? prev : ["수집 중..."]),
        "수집 실패",
      ]);
    } finally {
      setLoading(false);
      setShowProgressModal(null);
      await refresh?.(); // 토큰/유저 상태 최신화
    }
  }

  async function runAnalysis() {
    setLoading(true);
    setStatus("1차 분석(요약) 중...");
    setLogs([]); // 수집 로그 초기화
    setShowProgressModal("analysis");
    try {
      await api.post("/ai/summary/missing", { storeId });
      setStatus("배치 요약 생성 중...");
      await api.post("/ai/summary/batch", { storeId });
      setStatus("2차 인사이트 리포트 생성 중...");
      await api.post("/ai/insight/report", { storeId });
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
      setStatus("분석 및 리포트 생성 완료! 대시보드로 이동할 수 있습니다.");
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
      setShowProgressModal(null);
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
            <p>1) 채널 연결: 분석하려는 매장의 플랫폼을 등록</p>
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
            분석하려는 매장의 URL주소를 입력하면 고유번호를 추출하고 저장합니다.
          </p>
          <div className="space-y-3">
            <div className="p-4 border rounded-xl bg-white shadow-xs space-y-2">
              <label className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      네이버 플레이스
                    </p>
                    <p className="text-xs text-gray-600">
                      해당 매장의 고유번호를 추출하여 저장합니다.
                    </p>
                  </div>
                </div>
              </label>
              <input
                type="text"
                placeholder="네이버 플레이스 URL 입력"
                value={naverUrl}
                onChange={(e) => setNaverUrl(e.target.value)}
                className="w-full border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-400"
              />
              <button
                onClick={extractPlaceId}
                disabled={loading}
                className="w-full py-3 bg-blue-50 text-blue-700 rounded-xl font-semibold text-sm border border-blue-100"
              >
                {loading ? "추출 중..." : "고유번호 추출하기"}
              </button>
              {naverPlaceId && (
                <p className="text-xs text-green-600">추출됨: {naverPlaceId}</p>
              )}
            </div>

            <div className="p-4 border rounded-xl bg-white shadow-xs space-y-2">
              <label className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      구글맵
                    </p>
                    <p className="text-xs text-gray-600">
                      해당 매장의 고유번호를 추출하여 저장합니다.
                    </p>
                  </div>
                </div>
              </label>
              <input
                type="text"
                placeholder="구글 지도 URL 입력"
                value={googleUrl}
                onChange={(e) => setGoogleUrl(e.target.value)}
                className="w-full border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-400"
              />
              <button
                onClick={async () => {
                  if (!googleUrl) {
                    alert("구글맵 URL을 입력하세요.");
                    return;
                  }
                  setLoading(true);
                  setStatus("매장 고유번호 추출 중...");
                  try {
                    const res = await api.post("/store/extract", {
                      url: googleUrl,
                    });
                    const provider = res.data?.provider;
                    if (provider === "google") {
                      setGooglePlaceId(res.data.placeId);
                      setStatus(
                        `고유번호 추출성공: ${res.data.placeId} (google)`
                      );
                    } else if (res.data?.placeId) {
                      // cid 등 placeId가 아닌 경우라도 우선 표시
                      setGooglePlaceId(res.data.placeId);
                      setStatus(
                        `고유번호 추출성공: ${res.data.placeId} (google)`
                      );
                    } else {
                      setStatus("구글 고유번호를 찾지 못했습니다.");
                    }
                  } catch {
                    setStatus("구글 고유번호 추출 실패. URL을 확인하세요.");
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
                className="w-full py-3 bg-blue-50 text-blue-700 rounded-xl font-semibold text-sm border border-blue-100"
              >
                {loading ? "추출 중..." : "고유번호 추출하기"}
              </button>
              {googlePlaceId && (
                <p className="text-xs text-green-600">
                  추출됨: {googlePlaceId}
                </p>
              )}
            </div>

            <div className="p-4 border rounded-xl bg-white shadow-xs space-y-2">
              <label className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      카카오맵
                    </p>
                    <p className="text-xs text-gray-600">
                      해당 매장의 고유번호를 추출하여 저장합니다.
                    </p>
                  </div>
                </div>
              </label>
              <input
                type="text"
                placeholder="카카오맵 URL 입력"
                value={kakaoUrl}
                onChange={(e) => setKakaoUrl(e.target.value)}
                className="w-full border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-400"
              />
              <button
                onClick={async () => {
                  if (!kakaoUrl) {
                    alert("카카오맵 URL을 입력하세요.");
                    return;
                  }
                  setLoading(true);
                  setStatus("매장 고유번호 추출 중...");
                  try {
                    const res = await api.post("/store/extract", {
                      url: kakaoUrl,
                    });
                    const provider = res.data?.provider;
                    if (provider === "kakao" || res.data?.placeId) {
                      setKakaoPlaceId(res.data.placeId);
                      setStatus(
                        `고유번호 추출성공: ${res.data.placeId} (kakao)`
                      );
                    } else {
                      setStatus("카카오 고유번호를 찾지 못했습니다.");
                    }
                  } catch {
                    setStatus("카카오 고유번호 추출 실패. URL을 확인하세요.");
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
                className="w-full py-3 bg-blue-50 text-blue-700 rounded-xl font-semibold text-sm border border-blue-100"
              >
                {loading ? "추출 중..." : "고유번호 추출하기"}
              </button>
              {kakaoPlaceId && (
                <p className="text-xs text-green-600">추출됨: {kakaoPlaceId}</p>
              )}
            </div>

            <button
              onClick={saveChannel}
              disabled={loading}
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold text-sm disabled:opacity-60"
            >
              {loading ? "저장 중..." : "채널 저장"}
            </button>
          </div>
          {status && <p className="text-xs text-gray-600">{String(status)}</p>}
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3">
          <h1 className="text-xl font-bold">리뷰 수집</h1>
          <p className="text-sm text-gray-700">
            스캔하려는 플랫폼을 선택해주세요.
          </p>
          <p className="text-xs text-gray-600">
            연결된 채널(네이버/구글)이 모두 있으면 둘 다 수집합니다.
          </p>
          <button
            onClick={() => setShowTokenModal(true)}
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold text-sm"
          >
            {loading ? "수집 중..." : "수집 시작"}
          </button>
          {status && <p className="text-xs text-gray-600">{String(status)}</p>}
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
          {status && <p className="text-xs text-gray-600">{String(status)}</p>}
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4 text-center">
          <h1 className="text-2xl font-bold">완료!</h1>
          <p className="text-sm text-gray-700">
            수집과 분석이 모두 끝났습니다. 대시보드에서 결과를 확인하세요.
          </p>
          <div className="space-y-2">
            <button
              onClick={() => router.push("/dashboard")}
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold text-sm"
            >
              대시보드로 이동
            </button>
          </div>
        </div>
      )}

      {showTokenModal && (
        <div className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-lg w-full max-w-sm p-5 space-y-3">
            <h3 className="text-lg font-semibold text-gray-900">
              이용권 사용 안내
            </h3>
            <p className="text-sm text-gray-700">
              리뷰 수집/분석을 시작하면 이용권 {requiredTokens}개가 사용됩니다.
            </p>
            <p className="text-xs text-gray-500">
              이용권 보유량: {(user as any)?.extraCredits ?? 0}개
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  const tokens = (user as any)?.extraCredits ?? 0;
                  if (tokens < requiredTokens) {
                    setStatus("이용권이 부족합니다. 충전 후 이용해주세요.");
                    setShowTokenModal(false);
                    router.push("/credits");
                    return;
                  }
                  setShowTokenModal(false);
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

      {showProgressModal && (
        <div className="fixed inset-0 z-[9998] bg-black/30 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-5 space-y-3 text-center">
            <h3 className="text-lg font-semibold text-gray-900">
              {showProgressModal === "crawl"
                ? "리뷰 수집 중"
                : "분석/리포트 생성 중"}
            </h3>
            <p className="text-sm text-gray-700">
              {status || "진행 중입니다..."}
            </p>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 animate-pulse" />
            </div>
            <p className="text-xs text-gray-500">
              잠시만 기다려주세요. 완료 시 자동으로 닫힙니다.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
