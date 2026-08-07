"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { BuildingIcon } from "@/shared/ui/icons";
import { Toaster } from "@/shared/ui/toast";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="sticky top-0 z-30 border-b border-zinc-800 bg-zinc-950/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-2 px-6">
          <Link
            href="/buildings"
            className="flex items-center gap-2 text-sm font-semibold text-zinc-100 transition-colors hover:text-white"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white">
              <BuildingIcon className="h-4 w-4" />
            </span>
            Floor Plan Editor
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
      <Toaster />
    </div>
  );
}
