"use client";

export default function LoadingOverlay() {
  return (
    <div className="fixed inset-0 bg-black/10 backdrop-blur-sm z-[9999] animate-fadeIn" />
  );
}
