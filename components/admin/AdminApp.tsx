"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { ExternalLink, Gift, LayoutDashboard, Loader2, LogOut, Palette, PenLine, ShieldCheck, Users } from "lucide-react";
import { admin, ApiError } from "@/lib/api";
import type { AdminData, Settings } from "@/lib/types";
import { Balloon } from "@/components/invite/Decor";
import { SaveBar, Toast, errText } from "./ui";
import Login from "./Login";
import Overview from "./Overview";
import Guests from "./Guests";
import Content from "./Content";
import Design from "./Design";
import Reveal from "./Reveal";
import Security from "./Security";
import Preview from "./Preview";

const TOKEN_KEY = "baby-reveal-admin";

export type Tab = "overview" | "guests" | "content" | "design" | "reveal" | "security";

const TABS: { id: Tab; label: string; icon: typeof Users }[] = [
  { id: "overview", label: "الرئيسية", icon: LayoutDashboard },
  { id: "guests", label: "المدعوين", icon: Users },
  { id: "content", label: "المحتوى", icon: PenLine },
  { id: "design", label: "التصميم", icon: Palette },
  { id: "reveal", label: "الكشف", icon: Gift },
  { id: "security", label: "الأمان", icon: ShieldCheck },
];

export default function AdminApp() {
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [data, setData] = useState<AdminData | null>(null);
  const [draft, setDraft] = useState<Settings | null>(null); // unsaved edits from Content + Design
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<Tab>("overview");
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const toast = useCallback((text: string, ok = true) => setMsg({ text, ok }), []);

  useEffect(() => {
    try {
      setToken(localStorage.getItem(TOKEN_KEY));
    } catch {}
    setReady(true);
    document.documentElement.dir = "rtl";
    document.documentElement.lang = "ar";
  }, []);

  const logout = useCallback(() => {
    if (token) admin.logout(token).catch(() => {});
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {}
    setToken(null);
    setData(null);
    setDraft(null);
  }, [token]);

  const reload = useCallback(async () => {
    if (!token) return;
    try {
      setData(await admin.getAll(token));
    } catch (e) {
      if (e instanceof ApiError && e.message === "unauthorized") logout();
      else toast(errText(e), false);
    }
  }, [token, logout, toast]);

  useEffect(() => {
    if (!token) return;
    reload();
    const id = setInterval(reload, 20000);
    return () => clearInterval(id);
  }, [token, reload]);

  const settings = draft ?? data?.settings ?? null;
  const dirty = !!draft && !!data && JSON.stringify(draft) !== JSON.stringify(data.settings);

  const set = useCallback(
    <K extends keyof Settings>(k: K, v: Settings[K]) => setDraft((p) => ({ ...(p ?? data!.settings), [k]: v })),
    [data],
  );
  const setS = useCallback((fn: (p: Settings) => Settings) => setDraft((p) => fn(p ?? data!.settings)), [data]);

  async function save() {
    if (!token || !draft) return;
    setSaving(true);
    try {
      const wishes = draft.sections.find((x) => x.id === "wishes");
      await admin.updateSettings(token, { ...draft, show_wishes: wishes?.visible ?? true });
      await reload();
      setDraft(null);
      toast("تم الحفظ والنشر ✓");
    } catch (e) {
      toast(errText(e), false);
    } finally {
      setSaving(false);
    }
  }

  if (!ready) return null;
  if (!token)
    return (
      <Login
        onLogin={(t) => {
          try {
            localStorage.setItem(TOKEN_KEY, t);
          } catch {}
          setToken(t);
        }}
      />
    );

  const editing = tab === "content" || tab === "design";

  return (
    <div className="min-h-[100svh] bg-cream" dir="rtl" style={{ fontFamily: "var(--font-arabic)" }}>
      <header className="sticky top-0 z-30 border-b border-ink/5 bg-cream/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Balloon color="pink" size={16} />
            <Balloon color="blue" size={16} />
            <span className="ms-1 font-bold">لوحة التحكم</span>
            {dirty && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">تعديلات مش محفوظة</span>}
          </div>
          <div className="flex items-center gap-2">
            <a href="/" target="_blank" className="flex items-center gap-1 rounded-full bg-white px-3 py-2 text-xs font-semibold shadow-sm">
              <ExternalLink size={14} /> الموقع
            </a>
            <button onClick={logout} className="flex items-center gap-1 rounded-full bg-white px-3 py-2 text-xs font-semibold text-rose-600 shadow-sm">
              <LogOut size={14} /> خروج
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-5">
        <nav className="sticky top-20 hidden h-fit w-48 shrink-0 space-y-1 md:block">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`relative flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${tab === t.id ? "text-ink" : "text-ink-soft hover:bg-white/60"}`}
            >
              {tab === t.id && <motion.span layoutId="side-pill" className="absolute inset-0 rounded-2xl bg-white shadow-sm" />}
              <t.icon size={18} className="relative" />
              <span className="relative">{t.label}</span>
            </button>
          ))}
        </nav>

        <main className="min-w-0 flex-1 pb-28 md:pb-24">
          <h2 className="mb-4 text-xl font-bold">{TABS.find((t) => t.id === tab)?.label}</h2>
          {!data || !settings ? (
            <div className="flex justify-center py-20">
              <Loader2 className="animate-spin text-ink-soft" />
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                {tab === "overview" && <Overview data={data} onTab={setTab} />}
                {tab === "guests" && <Guests data={data} token={token} reload={reload} toast={toast} />}
                {tab === "content" && <Content s={settings} set={set} setS={setS} />}
                {tab === "design" && <Design s={settings} set={set} token={token} toast={toast} />}
                {tab === "reveal" && <Reveal data={data} token={token} reload={reload} toast={toast} />}
                {tab === "security" && <Security token={token} toast={toast} />}
              </motion.div>
            </AnimatePresence>
          )}
        </main>

        {editing && settings && <Preview settings={settings} />}
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-ink/5 bg-white/95 backdrop-blur md:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="grid grid-cols-6">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`flex flex-col items-center gap-1 py-2.5 text-[10px] font-semibold ${tab === t.id ? "text-ink" : "text-ink-soft/70"}`}>
              <t.icon size={20} />
              {t.label}
            </button>
          ))}
        </div>
      </nav>

      <SaveBar visible={dirty} busy={saving} onSave={save} onReset={() => setDraft(null)} />
      <Toast msg={msg} onClose={() => setMsg(null)} />
    </div>
  );
}
