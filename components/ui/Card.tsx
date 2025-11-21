export default function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-white border rounded-xl p-5 shadow-sm ${className}`}>
      {children}
    </div>
  );
}
