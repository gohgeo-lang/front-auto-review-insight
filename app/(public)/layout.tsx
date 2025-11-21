import "../globals.css";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="bg-[#fafafa] min-h-screen mx-auto">
        <div className="w-full max-w-[430px] mx-auto">{children}</div>
      </body>
    </html>
  );
}
