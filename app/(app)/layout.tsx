// app/(app)/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import BottomNav from "@/components/BottomNav";
import { GuardWrapper } from "./guard-wrapper";
import { ClientToaster } from "@/components/ClientToaster";

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
  title: "EMILY",
  description: "정기 고객반응 리포트를 챙겨주는 비서",
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <GuardWrapper>
      <div
        className={`${geistSans.variable} ${geistMono.variable} w-full max-w-[430px] min-h-screen relative bg-white`}
      >
        <main className="pt-1 pb-[70px] px-0">{children}</main>
        <BottomNav />
        <ClientToaster />
      </div>
    </GuardWrapper>
  );
}
