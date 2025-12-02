import "./globals.css";
import { AuthProvider } from "./context/AuthContext";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <title>EMILY | 매장 관리 쉽고 편하게</title>
        <link rel="icon" href="/favicon.svg" />
      </head>
      <body className="bg-[#fafafa] min-h-screen flex justify-center">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
