import AuthProvider from "../context/AuthContext";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="bg-[#fafafa] min-h-screen mx-auto">
        <AuthProvider>
          <div className="w-full max-w-[430px] mx-auto">{children}</div>
        </AuthProvider>
      </body>
    </html>
  );
}
