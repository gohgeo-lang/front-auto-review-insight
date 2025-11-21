export default function OnboardingSlide({
  title,
  desc,
  image,
}: {
  title: string;
  desc: string;
  image: string;
}) {
  return (
    <div className="flex flex-col items-center text-center px-4 animate-fadeIn">
      {/* 이미지 영역 */}
      <div className="w-full h-60 flex items-center justify-center mb-10">
        <div className="w-48 h-48 bg-gray-100 rounded-2xl flex items-center justify-center">
          {/* 실제 서비스에서는 이미지 파일 사용 */}
          <span className="text-gray-400">이미지</span>
        </div>
      </div>

      {/* 텍스트 */}
      <h1 className="text-2xl font-bold whitespace-pre-line mb-3">{title}</h1>
      <p className="text-gray-600 text-base whitespace-pre-line">{desc}</p>
    </div>
  );
}
