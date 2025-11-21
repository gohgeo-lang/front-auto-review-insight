export default function DotIndicator({
  total,
  index,
}: {
  total: number;
  index: number;
}) {
  return (
    <div className="flex gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`w-2.5 h-2.5 rounded-full transition-all ${
            i === index ? "bg-blue-600 w-5" : "bg-gray-300"
          }`}
        />
      ))}
    </div>
  );
}
