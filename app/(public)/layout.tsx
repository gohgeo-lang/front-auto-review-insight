import "../globals.css";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full max-w-[430px] min-h-screen mx-auto bg-[#fafafa]">
      {children}
    </div>
  );
}
