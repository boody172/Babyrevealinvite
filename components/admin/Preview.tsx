"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { RotateCw, Smartphone, X } from "lucide-react";
import type { Settings } from "@/lib/types";
import { PREVIEW_MESSAGE } from "@/components/invite/Invitation";

/** The real invitation page in an iframe, fed the dashboard's unsaved settings. */
function Frame({ slug, settings, className = "" }: { slug: string; settings: Settings; className?: string }) {
  const ref = useRef<HTMLIFrameElement>(null);
  const [key, setKey] = useState(0);

  const push = useCallback(() => {
    ref.current?.contentWindow?.postMessage({ type: PREVIEW_MESSAGE, settings }, window.location.origin);
  }, [settings]);

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

/** Desktop: sticky phone beside the editor. Mobile: floating button that opens a full-screen preview. */
export default function Preview({ slug, settings }: { slug: string; settings: Settings }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="sticky top-20 hidden h-fit shrink-0 xl:block">
        <p className="mb-2 text-center text-xs font-semibold text-ink-soft">معاينة مباشرة (قبل الحفظ)</p>
        <Frame slug={slug} settings={settings} className="h-[720px] w-[360px]" />
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
            <div className="mb-2 flex items-center justify-between text-white">
              <span className="text-sm font-semibold">معاينة التعديلات (قبل الحفظ)</span>
              <button onClick={() => setOpen(false)} className="rounded-full bg-white/20 p-2" aria-label="إغلاق">
                <X size={18} />
              </button>
            </div>
            <motion.div initial={{ y: 40 }} animate={{ y: 0 }} className="mx-auto h-full w-full max-w-[420px] flex-1">
              <Frame slug={slug} settings={settings} className="h-full w-full" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
