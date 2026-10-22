"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { MousePointerClick, RotateCw, Smartphone, X } from "lucide-react";
import type { Lang, Settings } from "@/lib/types";
import { PREVIEW_MESSAGE, EDIT_MESSAGE } from "@/components/invite/Invitation";

export type OnEdit = (key: string, value: string, lang: Lang) => void;

/** The real invitation page in an iframe, fed the dashboard's unsaved settings. */
function Frame({ slug, settings, lang, edit, className = "" }: { slug: string; settings: Settings; lang: Lang; edit: boolean; className?: string }) {
  const ref = useRef<HTMLIFrameElement>(null);
  const [key, setKey] = useState(0);

  const push = useCallback(() => {
    ref.current?.contentWindow?.postMessage({ type: PREVIEW_MESSAGE, settings, lang, edit }, window.location.origin);
  }, [settings, lang, edit]);

  useEffect(push, [push]);
  useEffect(() => {
    const onReady = (e: MessageEvent) => {
      if (e.origin === window.location.origin && e.data?.type === `${PREVIEW_MESSAGE}:ready`) push();
    };
    window.addEventListener("message", onReady);
    return () => window.removeEventListener("message", onReady);
  }, [push]);

  return (
    <div className={`relative overflow-hidden rounded-[36px] border-[8px] border-ink bg-ink shadow-2xl ${className}`}>
      <iframe key={key} ref={ref} src={`/${slug}?preview=1`} title="معاينة" className="h-full w-full rounded-[28px] bg-cream" onLoad={push} />
      <button
        onClick={() => setKey((k) => k + 1)}
        className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-ink/80 px-3 py-1.5 text-[11px] font-semibold text-white backdrop-blur"
      >
        <RotateCw size={12} /> إعادة
      </button>
    </div>
  );
}

/** Toggle that turns the preview into a click-to-edit surface for every text on the page. */
function EditToggle({ on, set, dark }: { on: boolean; set: (v: boolean) => void; dark?: boolean }) {
  return (
    <button
      onClick={() => set(!on)}
      aria-pressed={on}
      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold transition ${
        on ? "bg-gradient-to-r from-pink-deep to-blue-deep text-white shadow" : dark ? "bg-white/20 text-white" : "bg-white text-ink shadow-sm"
      }`}
    >
      <MousePointerClick size={13} /> {on ? "وضع تعديل النصوص: شغال" : "اضغط على أي نص لتعديله"}
    </button>
  );
}

/** Desktop: sticky phone beside the editor. Mobile: floating button that opens a full-screen preview. */
export default function Preview({ slug, settings, lang, onEdit }: { slug: string; settings: Settings; lang: Lang; onEdit: OnEdit }) {
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState(false);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.data?.type !== EDIT_MESSAGE) return;
      const { key, value, lang: l } = e.data as { key: string; value: string; lang: Lang };
      if (typeof key === "string" && typeof value === "string") onEdit(key, value, l);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [onEdit]);

  return (
    <>
      <div className="sticky top-20 hidden h-fit shrink-0 xl:block">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-xs font-semibold text-ink-soft">معاينة مباشرة (قبل الحفظ)</p>
          <EditToggle on={edit} set={setEdit} />
        </div>
        <Frame slug={slug} settings={settings} lang={lang} edit={edit} className="h-[720px] w-[360px]" />
        {edit && <p className="mt-2 max-w-[360px] text-center text-[11px] text-ink-soft">اضغط على أي كلمة في المعاينة، عدّلها، واضغط Enter. التعديل بيتحفظ لما تدوس حفظ.</p>}
      </div>

      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-40 start-4 z-30 flex items-center gap-2 rounded-full bg-gradient-to-r from-pink-deep to-blue-deep px-4 py-3 text-sm font-semibold text-white shadow-lg md:bottom-24 xl:hidden"
      >
        <Smartphone size={16} /> معاينة
      </button>

      <AnimatePresence>
        {open && (
          <motion.div className="fixed inset-0 z-[70] flex flex-col bg-ink/70 p-3 backdrop-blur" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="mb-2 flex items-center justify-between gap-2 text-white">
              <EditToggle on={edit} set={setEdit} dark />
              <button onClick={() => setOpen(false)} className="rounded-full bg-white/20 p-2" aria-label="إغلاق">
                <X size={18} />
              </button>
            </div>
            <motion.div initial={{ y: 40 }} animate={{ y: 0 }} className="mx-auto h-full w-full max-w-[420px] flex-1">
              <Frame slug={slug} settings={settings} lang={lang} edit={edit} className="h-full w-full" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
