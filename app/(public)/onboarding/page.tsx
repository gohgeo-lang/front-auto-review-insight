"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import OnboardingSlide from "./_components/OnboardingSlide";
import DotIndicator from "./_components/DotIndicator";
import NextButton from "./_components/NextButton";

export default function OnboardingPage() {
  const router = useRouter();
  const [index, setIndex] = useState(0);

  const slides = [
    {
      title: "리뷰 관리,\nAI가 대신합니다.",
      desc: "여러 플랫폼 리뷰를 자동으로 모아보고\n핵심만 빠르게 확인하세요.",
      image: "/onboarding/slide1.png",
    },
    {
      title: "긍정/부정 분석",
      desc: "AI가 리뷰를 읽고\n감성 요약과 패턴을 자동 제공해요.",
      image: "/onboarding/slide2.png",
    },
    {
      title: "자동 응대문 생성",
      desc: "사장님 스타일에 맞춰\n맞춤 응답 문구까지 한 번에.",
      image: "/onboarding/slide3.png",
    },
  ];

  const goNext = () => {
    if (index < slides.length - 1) setIndex(index + 1);
    else router.push("/"); // 온보딩 끝 → 홈으로 이동
  };

  return (
    <div className="w-full h-full flex flex-col justify-between pb-8 pt-16 px-6">
      {/* 슬라이드 */}
      <OnboardingSlide {...slides[index]} />

      {/* 인디케이터 */}
      <div className="flex justify-center mb-6">
        <DotIndicator total={slides.length} index={index} />
      </div>

      {/* 버튼 */}
      <NextButton index={index} total={slides.length} onNext={goNext} />
    </div>
  );
}
