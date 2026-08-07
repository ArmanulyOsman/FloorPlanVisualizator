"use client";

import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

export function Input({ label, className = "", ...props }: InputProps) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="text-zinc-400">{label}</span>
      <input
        className={`rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100 outline-none ring-blue-500 focus:ring-2 ${className}`}
        {...props}
      />
    </label>
  );
}
