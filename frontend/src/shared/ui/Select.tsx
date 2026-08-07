"use client";

import type { SelectHTMLAttributes } from "react";
import { inputClasses } from "@/shared/ui/Input";

type SelectOption = { value: string; label: string };

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  options: readonly string[] | readonly SelectOption[];
};

function toOption(option: string | SelectOption): SelectOption {
  return typeof option === "string" ? { value: option, label: option } : option;
}

export function Select({ label, options, className = "", ...props }: SelectProps) {
  return (
    <label className="flex w-full min-w-0 flex-col gap-1.5">
      {label && (
        <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</span>
      )}
      <span className="relative flex items-center">
        <select className={`${inputClasses} cursor-pointer appearance-none pr-8 ${className}`} {...props}>
          {options.map((option) => {
            const item = toOption(option);
            return (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            );
          })}
        </select>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="pointer-events-none absolute right-2.5 h-4 w-4 text-zinc-500"
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </span>
    </label>
  );
}
