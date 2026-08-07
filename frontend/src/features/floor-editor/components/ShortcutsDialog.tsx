"use client";

import { useEditorStore } from "@/features/floor-editor/store/editorStore";
import { SHORTCUT_GROUPS } from "@/features/floor-editor/tools";
import { IconButton } from "@/shared/ui/IconButton";
import { CloseIcon } from "@/shared/ui/icons";

export function ShortcutsDialog() {
  const isOpen = useEditorStore((state) => state.isShortcutsOpen);
  const setShortcutsOpen = useEditorStore((state) => state.setShortcutsOpen);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard shortcuts"
      className="animate-fade-in fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-6 backdrop-blur-sm"
      onClick={() => setShortcutsOpen(false)}
    >
      <div
        className="max-h-full w-full max-w-2xl overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
          <h2 className="text-base font-semibold text-zinc-100">Keyboard shortcuts</h2>
          <IconButton
            size="sm"
            tooltipSide="left"
            icon={<CloseIcon className="h-4 w-4" />}
            label="Close"
            shortcut="Esc"
            onClick={() => setShortcutsOpen(false)}
          />
        </div>

        <div className="grid gap-x-8 gap-y-6 p-5 sm:grid-cols-2">
          {SHORTCUT_GROUPS.map((group) => (
            <section key={group.title}>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                {group.title}
              </h3>
              <ul className="flex flex-col gap-1.5">
                {group.items.map((item) => (
                  <li key={item.action} className="flex items-center justify-between gap-4">
                    <span className="text-sm text-zinc-300">{item.action}</span>
                    <span className="flex shrink-0 items-center gap-1">
                      {item.keys.map((key) => (
                        <kbd
                          key={key}
                          className="rounded border border-zinc-700 bg-zinc-900 px-1.5 py-0.5 text-[11px] text-zinc-300"
                        >
                          {key}
                        </kbd>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
