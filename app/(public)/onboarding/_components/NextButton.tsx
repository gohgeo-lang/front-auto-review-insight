export default function NextButton({
  index,
  total,
  onNext,
}: {
  index: number;
  total: number;
  onNext: () => void;
}) {
  const isLast = index === total - 1;

  return (
    <button
      onClick={onNext}
      className="w-full py-4 bg-blue-600 text-white rounded-xl font-semibold active:scale-95 transition"
    >
      {isLast ? "시작하기" : "다음"}
    </button>
  );
}
