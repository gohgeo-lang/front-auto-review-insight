"use client";

import React from "react";

type Props = {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "outline";
  className?: string;
};

export default function Button({
  children,
  onClick,
  disabled,
  variant = "primary",
  className = "",
}: Props) {
  const base =
    "w-full py-3 rounded-xl font-semibold active:scale-[0.97] transition text-center";

  const variants = {
    primary: "bg-blue-600 text-white",
    secondary: "bg-gray-100 text-gray-700",
    outline: "border border-gray-300 text-gray-700",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${className} ${
        disabled ? "opacity-60" : ""
      }`}
    >
      {children}
    </button>
  );
}
