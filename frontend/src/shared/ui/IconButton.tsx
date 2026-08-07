"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

export type TooltipSide = "top" | "bottom" | "left" | "right";

type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type" | "children"> & {
  icon: ReactNode;
  label: string;
  shortcut?: string;
  description?: string;
  active?: boolean;
  tooltipSide?: TooltipSide;
  size?: "sm" | "md";
};

const tooltipPosition: Record<TooltipSide, string> = {
  top: "bottom-full left-1/2 mb-2 -translate-x-1/2",
  bottom: "top-full left-1/2 mt-2 -translate-x-1/2",
  left: "right-full top-1/2 mr-2 -translate-y-1/2",
  right: "left-full top-1/2 ml-2 -translate-y-1/2",
};

const sizeClasses = {
  sm: "h-8 w-8",
  md: "h-9 w-9",
};

export function IconButton({
  icon,
  label,
  shortcut,
  description,
  active = false,
  tooltipSide = "right",
  size = "md",
  disabled,
  className = "",
  ...props
}: IconButtonProps) {
  return (
    <div className="group/tip relative flex">
      <button
        type="button"
        aria-label={label}
        aria-pressed={active}
        disabled={disabled}
        className={`inline-flex items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:pointer-events-none disabled:opacity-30 ${
          sizeClasses[size]
        } ${
          active
            ? "bg-blue-600 text-white shadow-sm"
            : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-50"
        } ${className}`}
        {...props}
      >
        {icon}
      </button>

      <span
        role="tooltip"
        className={`pointer-events-none absolute z-50 hidden w-max max-w-56 rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-100 opacity-0 shadow-xl transition-opacity delay-150 duration-100 group-hover/tip:opacity-100 md:block ${tooltipPosition[tooltipSide]}`}
      >
        <span className="flex items-center gap-2">
          <span className="font-medium">{label}</span>
          {shortcut && (
            <kbd className="rounded border border-zinc-600 bg-zinc-800 px-1 py-px font-mono text-[10px] text-zinc-300">
              {shortcut}
            </kbd>
          )}
        </span>
        {description && <span className="mt-0.5 block text-zinc-400">{description}</span>}
      </span>
    </div>
  );
}
