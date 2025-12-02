"use client";

export default function StoryModal({ open, onClose, label }: any) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white w-[350px] rounded-xl shadow-lg p-6 animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{label}</h2>
          <button className="text-gray-500 hover:text-black" onClick={onClose}>
            ✕
          </button>
        </div>

        <p className="text-gray-700 leading-relaxed">
          {label}에 대한 간단한 인사이트를 준비했습니다.
          <br />
          여기에는 리뷰 요약, 최근 리뷰 정보,
          <br />
          또는 플랫폼별 분석 내용을 표시할 수 있습니다.
        </p>

        <div className="mt-5 w-full bg-gray-100 rounded-lg h-32 flex items-center justify-center text-gray-400">
          차트 · 요약 · 통계 UI 들어갈 영역
        </div>
      </div>
    </div>
  );
}
