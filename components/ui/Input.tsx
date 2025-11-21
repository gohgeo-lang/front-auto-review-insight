"use client";

export default function Input({
  value,
  onChange,
  placeholder = "",
  className = "",
  type = "text",
}: any) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`w-full border px-4 py-3 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
    />
  );
}
