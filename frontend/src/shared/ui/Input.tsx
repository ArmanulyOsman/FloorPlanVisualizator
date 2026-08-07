"use client";

import type { InputHTMLAttributes, ReactNode } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
  suffix?: ReactNode;
};

export const inputClasses =
  "w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 transition-colors outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-zinc-900/50 disabled:text-zinc-500";

export function Input({ label, hint, error, suffix, className = "", ...props }: InputProps) {
  return (
    <label className="flex w-full min-w-0 flex-col gap-1.5">
      {label && (
        <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</span>
      )}
      <span className="relative flex items-center">
        <input
          className={`${inputClasses} ${error ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""} ${suffix ? "pr-10" : ""} ${className}`}
          {...props}
        />
        {suffix && (
          <span className="pointer-events-none absolute right-3 text-xs text-zinc-500">
            {suffix}
          </span>
        )}
      </span>
      {error ? (
        <span className="text-xs text-red-400">{error}</span>
      ) : hint ? (
        <span className="text-xs text-zinc-500">{hint}</span>
      ) : null}
    </label>
  );
}
