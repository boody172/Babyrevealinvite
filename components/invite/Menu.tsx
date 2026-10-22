"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, Lock, Menu as MenuIcon, X } from "lucide-react";
import type { Dict } from "@/lib/i18n";
import type { SectionId, Settings } from "@/lib/types";
import { admin } from "@/lib/api";
import { ADMIN_TOKEN_KEY } from "@/lib/session";
import { Balloon } from "./Decor";

const NAV: Record<SectionId, keyof Dict> = {
  countdown: "navCountdown",
  details: "navDetails",
  map: "navMap",
  vote: "navVote",
  rsvp: "navRsvp",
  wishes: "navWishes",
};

export const sectionAnchor = (id: SectionId | "top") => `sec-${id}`;

/** Floating ☰ button: jump to any part of the invitation, or sign in to the dashboard. */
export default function Menu({ s, d, sections }: { s: Settings; d: Dict; sections: SectionId[] }) {
  const [open, setOpen] = useState(false);
  const [login, setLogin] = useState(false);
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(false);
  const rtl = s.language === "ar";
  const Arrow = rtl ? ChevronLeft : ChevronRight;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function go(id: SectionId | "top") {
    setOpen(false);
    // let the drawer close before scrolling so the page isn't locked
    setTimeout(() => document.getElementById(sectionAnchor(id))?.scrollIntoView({ behavior: "smooth", block: "start" }), 250);
  }

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(false);
    try {
      const token = await admin.login(pw);
      try {
        localStorage.setItem(ADMIN_TOKEN_KEY, token);
      } catch {}
      window.location.href = "/admin";
    } catch {
      setErr(true);
      setBusy(false);
    }
  }

  return (
    <>
      <motion.button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={d.menu}
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.8 }}
        whileTap={{ scale: 0.9 }}
        className="glass fixed top-4 z-40 flex h-12 w-12 items-center justify-center rounded-full text-ink"
        style={{ insetInlineStart: 16 }}
      >
        <MenuIcon size={22} />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div className="fixed inset-0 z-[60]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-ink/30 backdrop-blur-[2px]" onClick={() => setOpen(false)} />
            <motion.nav
              initial={{ x: rtl ? "100%" : "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: rtl ? "100%" : "-100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
              className="absolute inset-y-0 flex w-[82%] max-w-xs flex-col overflow-y-auto bg-cream p-5 shadow-2xl"
              style={{ insetInlineStart: 0 }}
              aria-label={d.menu}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Balloon color="pink" size={18} dotted />
                  <Balloon color="blue" size={18} />
                </div>
                <button onClick={() => setOpen(false)} className="rounded-full bg-white p-2 shadow-sm" aria-label="close">
                  <X size={18} />
                </button>
              </div>
              <p className="font-script mt-4 text-4xl leading-snug">{s.baby_name}</p>

              <div className="mt-4 space-y-1">
                {(["top", ...sections] as const).map((id, i) => (
                  <motion.button
                    key={id}
                    onClick={() => go(id)}
                    initial={{ opacity: 0, x: rtl ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 + i * 0.04 }}
                    className="flex w-full items-center justify-between rounded-2xl px-4 py-3.5 text-start font-sans text-base font-semibold transition hover:bg-white active:scale-[0.98]"
                  >
                    {id === "top" ? d.navTop : (d[NAV[id]] as string)}
                    <Arrow size={16} className="text-ink-soft" />
                  </motion.button>
                ))}
              </div>

              <div className="mt-auto pt-6">
                <div className="gold-line mb-4" />
                {!login ? (
                  <button onClick={() => setLogin(true)} className="flex w-full items-center gap-2 rounded-2xl px-4 py-3 font-sans text-sm font-semibold text-ink-soft hover:bg-white">
                    <Lock size={16} /> {d.adminLogin}
                  </button>
                ) : (
                  <form onSubmit={signIn} className="space-y-2 rounded-2xl bg-white p-3">
                    <input
                      type="password"
                      autoFocus
                      dir="ltr"
                      value={pw}
                      onChange={(e) => setPw(e.target.value)}
                      placeholder={d.password}
                      autoComplete="current-password"
                      className="input text-center"
                    />
                    {err && <p className="text-center font-sans text-xs text-rose-600">{d.wrongPassword}</p>}
                    <button disabled={busy || !pw} className="flex w-full items-center justify-center gap-2 rounded-full bg-ink py-3 font-sans text-sm font-semibold text-cream disabled:opacity-50">
                      {busy && <Loader2 size={16} className="animate-spin" />} {d.enter}
                    </button>
                  </form>
                )}
              </div>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
