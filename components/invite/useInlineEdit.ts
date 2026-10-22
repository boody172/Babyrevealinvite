"use client";

import { useEffect } from "react";
import type { Lang } from "@/lib/types";

export const EDIT_MESSAGE = "baby-reveal:edit";

/**
 * Dashboard preview only: while enabled, clicking any [data-edit] text makes it editable in place.
 * On Enter / blur the new text is posted to the dashboard, which applies it to its unsaved draft
 * and sends the settings back, so React stays the single source of truth for what is rendered.
 */
export function useInlineEdit(enabled: boolean, lang: Lang) {
  useEffect(() => {
    document.documentElement.toggleAttribute("data-edit-mode", enabled);
    if (!enabled) return;

    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement).closest<HTMLElement>("[data-edit]");
      if (!el || el.isContentEditable) return;
      e.preventDefault();
      e.stopPropagation();
      const original = el.textContent ?? "";
      el.contentEditable = "plaintext-only";
      el.focus();
      document.getSelection()?.selectAllChildren(el);

      const finish = (commit: boolean) => {
        el.removeEventListener("keydown", onKey);
        el.removeEventListener("blur", onBlur);
        const value = (el.textContent ?? "").trim();
        el.contentEditable = "false";
        el.textContent = original; // React re-renders the new value once the dashboard applies it
        if (commit && value && value !== original.trim()) {
          window.parent?.postMessage({ type: EDIT_MESSAGE, key: el.dataset.edit, value, lang }, window.location.origin);
        }
      };
      const onKey = (ev: KeyboardEvent) => {
        if (ev.key === "Enter") {
          ev.preventDefault();
          el.blur();
        } else if (ev.key === "Escape") finish(false);
      };
      const onBlur = () => finish(true);
      el.addEventListener("keydown", onKey);
      el.addEventListener("blur", onBlur);
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [enabled, lang]);
}
