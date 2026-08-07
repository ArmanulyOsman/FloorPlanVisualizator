"use client";

import type { SelectHTMLAttributes } from "react";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  options: readonly string[];
};

export function Select({ label, options, className = "", ...props }: SelectProps) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="text-zinc-400">{label}</span>
      <select
        className={`rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100 outline-none ring-blue-500 focus:ring-2 ${className}`}
        {...props}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
