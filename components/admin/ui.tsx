"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect } from "react";
import { Loader2, Save } from "lucide-react";
import { ApiError } from "@/lib/api";

export type ToastFn = (text: string, ok?: boolean) => void;

export function errText(e: unknown) {
  const m = e instanceof ApiError ? e.message : "";
  const map: Record<string, string> = {
    invalid_password: "كلمة السر غلط",
    unauthorized: "انتهت الجلسة، سجّل دخول تاني",
    password_too_short: "كلمة السر لازم ٨ حروف على الأقل",
    gender_required: "اختار النوع الأول",
  };
  return map[m] || "حصلت مشكلة، حاول تاني";
}

export function Toast({ msg, onClose }: { msg: { text: string; ok: boolean } | null; onClose: () => void }) {
  useEffect(() => {
    if (!msg) return;
    const id = setTimeout(onClose, 2600);
    return () => clearTimeout(id);
  }, [msg, onClose]);
  return (
    <AnimatePresence>
      {msg && (
        <motion.div
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -30, opacity: 0 }}
          className={`fixed left-1/2 top-16 z-[60] -translate-x-1/2 rounded-full px-5 py-3 text-sm font-semibold text-white shadow-lg ${
            msg.ok ? "bg-emerald-600" : "bg-rose-600"
          }`}
        >
          {msg.text}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function Card({ children, className = "", title, hint }: { children: React.ReactNode; className?: string; title?: string; hint?: string }) {
  return (
    <div className={`rounded-3xl bg-white p-5 shadow-[0_10px_40px_-24px_rgba(78,61,48,0.35)] ring-1 ring-ink/5 ${className}`}>
      {title && <p className="text-sm font-bold">{title}</p>}
      {hint && <p className="mt-1 text-xs text-ink-soft">{hint}</p>}
      {(title || hint) && <div className="mt-4" />}
      {children}
    </div>
  );
}

export function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className="flex w-full items-center justify-between gap-4 rounded-2xl bg-cream px-4 py-3 text-start">
      <span>
        <span className="block text-sm font-semibold">{label}</span>
        {hint && <span className="block text-xs text-ink-soft">{hint}</span>}
      </span>
      <span className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${checked ? "bg-emerald-500" : "bg-ink/15"}`}>
        <motion.span
          layout
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="absolute top-1 h-5 w-5 rounded-full bg-white shadow"
          style={{ insetInlineStart: checked ? "1.5rem" : "0.25rem" }}
        />
      </span>
    </button>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-ink-soft">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-ink-soft">{hint}</span>}
    </label>
  );
}

export function TextField({
  label,
  value,
  onChange,
  multiline,
  type = "text",
  dir,
  hint,
  placeholder,
  onBlur,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  type?: string;
  dir?: "ltr" | "rtl" | "auto";
  hint?: string;
  placeholder?: string;
  onBlur?: () => void;
}) {
  return (
    <Field label={label} hint={hint}>
      {multiline ? (
        <textarea className="input min-h-24" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} onBlur={onBlur} dir={dir ?? "auto"} />
      ) : (
        <input className="input" type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} onBlur={onBlur} dir={dir ?? "auto"} />
      )}
    </Field>
  );
}

export function IconBtn({ children, onClick, title, danger, disabled }: { children: React.ReactNode; onClick: () => void; title: string; danger?: boolean; disabled?: boolean }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-xl p-2.5 transition active:scale-90 disabled:opacity-30 ${danger ? "bg-rose-50 text-rose-600" : "bg-cream text-ink"}`}
    >
      {children}
    </button>
  );
}

export function SaveBar({ visible, busy, onSave, onReset }: { visible: boolean; busy: boolean; onSave: () => void; onReset: () => void }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div initial={{ y: 80 }} animate={{ y: 0 }} exit={{ y: 80 }} className="fixed inset-x-0 bottom-20 z-40 flex justify-center gap-2 px-4 md:bottom-6">
          <button onClick={onReset} className="rounded-full bg-white px-5 py-3.5 text-sm font-semibold shadow-lg ring-1 ring-ink/10">
            إلغاء
          </button>
          <button onClick={onSave} disabled={busy} className="flex items-center gap-2 rounded-full bg-ink px-7 py-3.5 text-sm font-semibold text-white shadow-lg">
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} حفظ ونشر التعديلات
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
