"use client";

import { useEffect } from "react";
import { create } from "zustand";
import { AlertIcon, CheckIcon, CloseIcon } from "@/shared/ui/icons";

export type ToastVariant = "success" | "error" | "info";

export type Toast = {
  id: number;
  message: string;
  variant: ToastVariant;
  duration: number;
};

type ToastState = {
  toasts: Toast[];
  push: (message: string, variant?: ToastVariant, duration?: number) => void;
  dismiss: (id: number) => void;
  clear: () => void;
};

let nextId = 0;

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],

  push: (message, variant = "info", duration = variant === "error" ? 6000 : 3000) => {
    // Collapse repeated messages so retry loops cannot flood the stack.
    const existing = get().toasts.find((toast) => toast.message === message);
    if (existing) {
      set((state) => ({
        toasts: state.toasts.map((toast) =>
          toast.id === existing.id ? { ...toast, variant, duration } : toast,
        ),
      }));
      return;
    }

    nextId += 1;
    const toast: Toast = { id: nextId, message, variant, duration };
    set((state) => ({ toasts: [...state.toasts.slice(-3), toast] }));
  },

  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),
  clear: () => set({ toasts: [] }),
}));

export function toast(message: string, variant: ToastVariant = "info") {
  useToastStore.getState().push(message, variant);
}

const variantStyles: Record<ToastVariant, string> = {
  success: "border-emerald-600/50 bg-emerald-950/90 text-emerald-100",
  error: "border-red-600/50 bg-red-950/90 text-red-100",
  info: "border-zinc-700 bg-zinc-900/95 text-zinc-100",
};

function ToastCard({ item }: { item: Toast }) {
  const dismiss = useToastStore((state) => state.dismiss);

  useEffect(() => {
    const timer = setTimeout(() => dismiss(item.id), item.duration);
    return () => clearTimeout(timer);
  }, [item.id, item.duration, dismiss]);

  return (
    <div
      role="status"
      className={`animate-toast-in pointer-events-auto flex w-80 items-start gap-2.5 rounded-xl border px-3.5 py-3 text-sm shadow-2xl backdrop-blur ${variantStyles[item.variant]}`}
    >
      {item.variant === "success" ? (
        <CheckIcon className="mt-0.5 h-4 w-4 shrink-0" />
      ) : item.variant === "error" ? (
        <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
      ) : null}
      <p className="flex-1 leading-snug">{item.message}</p>
      <button
        type="button"
        onClick={() => dismiss(item.id)}
        aria-label="Dismiss notification"
        className="shrink-0 rounded p-0.5 opacity-60 transition hover:opacity-100"
      >
        <CloseIcon className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function Toaster() {
  const toasts = useToastStore((state) => state.toasts);

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex flex-col items-end gap-2">
      {toasts.map((item) => (
        <ToastCard key={item.id} item={item} />
      ))}
    </div>
  );
}
