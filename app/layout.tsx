import "./globals.css";
import { AuthProvider } from "./context/AuthContext";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="bg-[#fafafa] min-h-screen flex justify-center">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
