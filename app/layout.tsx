import "./globals.css";

export const metadata = {
  title: "Review Auto Insight",
  description: "리뷰 자동 수집/요약 SaaS",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
