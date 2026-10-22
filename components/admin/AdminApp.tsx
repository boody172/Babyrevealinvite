"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, ExternalLink, Gift, LayoutDashboard, Layers, Loader2, LogOut, Palette, PenLine, ShieldCheck, Users } from "lucide-react";
import { admin, ApiError } from "@/lib/api";
import type { AdminData, InvitationSummary, Lang, Settings, TextKey } from "@/lib/types";
import { TEXT_KEYS } from "@/lib/types";
import { Balloon } from "@/components/invite/Decor";
import { SaveBar, Toast, errText } from "./ui";
import Login from "./Login";
import Invitations, { shareUrl } from "./Invitations";
import Overview from "./Overview";
import Guests from "./Guests";
import Content from "./Content";
import Design from "./Design";
import Reveal from "./Reveal";
import Security from "./Security";
import Preview, { type OnEdit } from "./Preview";

import { ADMIN_TOKEN_KEY as TOKEN_KEY } from "@/lib/session";

const SELECTED_KEY = "baby-reveal-admin-invitation";

export type Tab = "invitations" | "overview" | "guests" | "content" | "design" | "reveal" | "security";

const TABS: { id: Tab; label: string; icon: typeof Users }[] = [
  { id: "invitations", label: "الدعوات", icon: Layers },
  { id: "overview", label: "الرئيسية", icon: LayoutDashboard },
  { id: "guests", label: "المدعوين", icon: Users },
  { id: "content", label: "المحتوى", icon: PenLine },
  { id: "design", label: "التصميم", icon: Palette },
  { id: "reveal", label: "الكشف", icon: Gift },
  { id: "security", label: "الأمان", icon: ShieldCheck },
];

const store = {
  get: (k: string) => {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  set: (k: string, v: string | null) => {
    try {
      if (v === null) localStorage.removeItem(k);
      else localStorage.setItem(k, v);
    } catch {}
  },
};

export default function AdminApp() {
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [list, setList] = useState<InvitationSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [data, setData] = useState<AdminData | null>(null);
  const [draft, setDraft] = useState<Settings | null>(null); // unsaved edits from Content + Design
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<Tab>("overview");
  const [editLang, setEditLang] = useState<Lang>("ar"); // language whose texts are being edited (also shown in the preview)
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const toast = useCallback((text: string, ok = true) => setMsg({ text, ok }), []);
  const selectedRef = useRef<string | null>(null);

  useEffect(() => {
    setToken(store.get(TOKEN_KEY));
    selectedRef.current = store.get(SELECTED_KEY);
    setSelectedId(selectedRef.current);
    setReady(true);
    document.documentElement.dir = "rtl";
    document.documentElement.lang = "ar";
  }, []);

  const logout = useCallback(() => {
    if (token) admin.logout(token).catch(() => {});
    store.set(TOKEN_KEY, null);
    setToken(null);
    setData(null);
    setDraft(null);
  }, [token]);

  const reload = useCallback(async () => {
    if (!token) return;
    try {
      const invitations = await admin.invitations(token);
      setList(invitations);
      // keep the selection if it still exists, else fall back to the home invitation
      let id = selectedRef.current;
      if (!invitations.some((x) => x.id === id)) id = (invitations.find((x) => x.is_home) ?? invitations[0])?.id ?? null;
      selectedRef.current = id;
      setSelectedId(id);
      setData(id ? await admin.invitation(token, id) : null);
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

  // a text changed by clicking it in the live preview: "c:<field>" is invitation content, "l:<label>" a UI label
  const inlineEdit = useCallback<OnEdit>(
    (key, value, lang) => {
      const [kind, field] = [key.slice(0, 2), key.slice(2)];
      setS((p) => {
        if (kind === "l:") return { ...p, labels: { ...p.labels, [lang]: { ...p.labels[lang], [field]: value } } };
        if (kind !== "c:" || !(TEXT_KEYS as readonly string[]).includes(field)) return p;
        const f = field as TextKey;
        if (lang === p.language) return { ...p, [f]: value };
        return { ...p, translations: { ...p.translations, [lang]: { ...p.translations[lang], [f]: value } } };
      });
    },
    [setS],
  );

  function select(id: string, openTab?: Tab) {
    if (id !== selectedRef.current) {
      if (dirty && !confirm("في تعديلات مش محفوظة على الدعوة الحالية. تسيبها وتفتح دعوة تانية؟")) return;
      selectedRef.current = id;
      store.set(SELECTED_KEY, id);
      setSelectedId(id);
      setDraft(null);
      setData(null);
      if (token) admin.invitation(token, id).then(setData, (e) => toast(errText(e), false));
    }
    if (openTab) setTab(openTab);
  }

  async function save() {
    if (!token || !draft || !data) return;
    setSaving(true);
    try {
      const wishes = draft.sections.find((x) => x.id === "wishes");
      const { id, name, slug } = data.invitation;
      await admin.update(token, id, name, slug, { ...draft, show_wishes: wishes?.visible ?? true });
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
          store.set(TOKEN_KEY, t);
          setToken(t);
        }}
      />
    );

  const editing = (tab === "content" || tab === "design") && data && settings;
  const current = list.find((x) => x.id === selectedId);

  return (
    <div className="min-h-[100svh] bg-cream" dir="rtl" style={{ fontFamily: "var(--font-arabic)" }}>
      <header className="sticky top-0 z-30 border-b border-ink/5 bg-cream/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <Balloon color="pink" size={16} />
            <Balloon color="blue" size={16} />
            <span className="ms-1 hidden font-bold sm:inline">لوحة التحكم</span>
            {list.length > 0 && (
              <label className="relative ms-1 flex min-w-0 items-center">
                <select
                  value={selectedId ?? ""}
                  onChange={(e) => select(e.target.value)}
                  className="max-w-[46vw] appearance-none truncate rounded-full bg-white py-2 pe-8 ps-3 text-xs font-bold shadow-sm sm:max-w-xs"
                  aria-label="الدعوة الحالية"
                >
                  {list.map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.name}
                      {x.is_home ? " (الرئيسية)" : ""}
                      {x.archived ? " (مؤرشفة)" : ""}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="pointer-events-none absolute end-2.5" />
              </label>
            )}
            {dirty && <span className="hidden rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700 sm:inline">تعديلات مش محفوظة</span>}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {current && (
              <a href={shareUrl(current)} target="_blank" className="flex items-center gap-1 rounded-full bg-white px-3 py-2 text-xs font-semibold shadow-sm">
                <ExternalLink size={14} /> <span className="hidden sm:inline">فتح الدعوة</span>
              </a>
            )}
            <button onClick={logout} className="flex items-center gap-1 rounded-full bg-white px-3 py-2 text-xs font-semibold text-rose-600 shadow-sm" aria-label="خروج">
              <LogOut size={14} /> <span className="hidden sm:inline">خروج</span>
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
          <h2 className="mb-4 text-xl font-bold">
            {TABS.find((t) => t.id === tab)?.label}
            {tab !== "invitations" && tab !== "security" && current && <span className="ms-2 text-sm font-semibold text-ink-soft">· {current.name}</span>}
          </h2>
          {tab === "invitations" ? (
            <Invitations list={list} selectedId={selectedId} token={token} onSelect={select} reload={reload} toast={toast} />
          ) : !data || !settings ? (
            <div className="flex justify-center py-20">
              <Loader2 className="animate-spin text-ink-soft" />
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div key={`${tab}-${data.invitation.id}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                {tab === "overview" && <Overview data={data} domain={current?.domain ?? null} onTab={setTab} />}
                {tab === "guests" && <Guests data={data} token={token} reload={reload} toast={toast} />}
                {tab === "content" && <Content s={settings} set={set} setS={setS} editLang={editLang} setEditLang={setEditLang} />}
                {tab === "design" && <Design s={settings} set={set} token={token} toast={toast} />}
                {tab === "reveal" && <Reveal data={data} token={token} reload={reload} toast={toast} />}
                {tab === "security" && <Security token={token} toast={toast} />}
              </motion.div>
            </AnimatePresence>
          )}
        </main>

        {editing && <Preview slug={data.invitation.slug} settings={settings} lang={settings.languages.includes(editLang) ? editLang : settings.language} onEdit={inlineEdit} />}
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-ink/5 bg-white/95 backdrop-blur md:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="grid grid-cols-7">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`flex flex-col items-center gap-1 py-2.5 text-[9px] font-semibold ${tab === t.id ? "text-ink" : "text-ink-soft/70"}`}>
              <t.icon size={19} />
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
