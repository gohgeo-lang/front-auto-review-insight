// app/(app)/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";

import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Review Auto Insight",
  description: "Online Review Analysis",
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${geistSans.variable} ${geistMono.variable} w-full max-w-[430px] min-h-screen relative bg-white`}
    >
      <Header />
      <main className="pt-[60px] pb-[70px]">{children}</main>
      <BottomNav />
    </div>
  );
}
