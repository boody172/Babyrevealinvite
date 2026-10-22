"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard,
  Users,
  PenLine,
  Gift,
  ShieldCheck,
  LogOut,
  ExternalLink,
  Loader2,
  Lock,
  Eye,
  EyeOff,
  Search,
  Plus,
  Trash2,
  RotateCcw,
  Download,
  Copy,
  Check,
  X,
  Save,
  MessageCircle,
  Pencil,
} from "lucide-react";
import { admin, ApiError } from "@/lib/api";
import { DEFAULT_CONTENT } from "@/lib/defaults";
import type { AdminData, Gender, Rsvp, Settings } from "@/lib/types";
import { Balloon } from "@/components/invite/Decor";

const TOKEN_KEY = "baby-reveal-admin";

type Tab = "overview" | "guests" | "content" | "reveal" | "security";

const TABS: { id: Tab; label: string; icon: typeof Users }[] = [
  { id: "overview", label: "الرئيسية", icon: LayoutDashboard },
  { id: "guests", label: "المدعوين", icon: Users },
  { id: "content", label: "محتوى الدعوة", icon: PenLine },
  { id: "reveal", label: "كشف النوع", icon: Gift },
  { id: "security", label: "الأمان", icon: ShieldCheck },
];

/* ---------------- shared UI ---------------- */

function Toast({ msg, onClose }: { msg: { text: string; ok: boolean } | null; onClose: () => void }) {
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
          className={`fixed top-16 left-1/2 z-[60] -translate-x-1/2 rounded-full px-5 py-3 text-sm font-semibold text-white shadow-lg ${
            msg.ok ? "bg-emerald-600" : "bg-rose-600"
          }`}
        >
          {msg.text}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-3xl bg-white p-5 shadow-[0_10px_40px_-24px_rgba(78,61,48,0.35)] ring-1 ring-ink/5 ${className}`}>{children}</div>;
}

function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
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

function TextField({
  label,
  value,
  onChange,
  multiline,
  type = "text",
  dir,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  type?: string;
  dir?: "ltr" | "rtl" | "auto";
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-ink-soft">{label}</span>
      {multiline ? (
        <textarea className="input min-h-24" value={value} onChange={(e) => onChange(e.target.value)} dir={dir ?? "auto"} />
      ) : (
        <input className="input" type={type} value={value} onChange={(e) => onChange(e.target.value)} dir={dir ?? "auto"} />
      )}
      {hint && <span className="mt-1 block text-[11px] text-ink-soft">{hint}</span>}
    </label>
  );
}

function errText(e: unknown) {
  const m = e instanceof ApiError ? e.message : "";
  const map: Record<string, string> = {
    invalid_password: "كلمة السر غلط",
    unauthorized: "انتهت الجلسة، سجّل دخول تاني",
    password_too_short: "كلمة السر لازم ٨ حروف على الأقل",
    gender_required: "اختار النوع الأول",
  };
  return map[m] || "حصلت مشكلة، حاول تاني";
}

/* ---------------- login ---------------- */

function Login({ onLogin }: { onLogin: (t: string) => void }) {
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const token = await admin.login(pw);
      onLogin(token);
    } catch (e) {
      setErr(errText(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="watercolor-bg flex min-h-[100svh] items-center justify-center px-5" dir="rtl">
      <motion.form
        onSubmit={submit}
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="glass w-full max-w-sm rounded-[32px] p-8 text-center"
      >
        <div className="mx-auto flex w-fit gap-1">
          <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity }}>
            <Balloon color="pink" size={30} dotted />
          </motion.div>
          <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 3.4, repeat: Infinity }}>
            <Balloon color="blue" size={30} />
          </motion.div>
        </div>
        <h1 className="mt-3 text-2xl font-bold">لوحة التحكم</h1>
        <p className="mt-1 text-sm text-ink-soft">ادخل كلمة السر عشان تدير الدعوة</p>
        <div className="relative mt-6">
          <Lock size={16} className="absolute top-1/2 -translate-y-1/2 text-ink-soft" style={{ insetInlineStart: 16 }} />
          <input
            type={show ? "text" : "password"}
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            className="input text-center"
            placeholder="كلمة السر"
            autoFocus
            dir="ltr"
            autoComplete="current-password"
          />
          <button type="button" onClick={() => setShow(!show)} className="absolute top-1/2 -translate-y-1/2 text-ink-soft" style={{ insetInlineEnd: 16 }}>
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {err && <p className="mt-3 text-sm text-rose-600">{err}</p>}
        <button
          disabled={busy || !pw}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-ink py-3.5 text-sm font-semibold text-white transition active:scale-95 disabled:opacity-50"
        >
          {busy && <Loader2 size={16} className="animate-spin" />} دخول
        </button>
      </motion.form>
    </main>
  );
}

/* ---------------- overview ---------------- */

function Overview({ data, onTab }: { data: AdminData; onTab: (t: Tab) => void }) {
  const live = data.rsvps.filter((r) => !r.deleted);
  const attending = live.filter((r) => r.attending);
  const headcount = attending.reduce((a, r) => a + r.guests, 0);
  const boys = live.filter((r) => r.guess === "boy").length;
  const girls = live.filter((r) => r.guess === "girl").length;
  const total = boys + girls;
  const boyPct = total ? Math.round((boys / total) * 100) : 50;
  const [copied, setCopied] = useState(false);
  const url = typeof window !== "undefined" ? window.location.origin : "";
  const waText = encodeURIComponent(`${data.settings.title} 💗💙\nولد ولا بنت؟ افتح الدعوة وأكد حضورك وخمّن 👇\n${url}`);

  const stats = [
    { label: "إجمالي الردود", value: live.length, tone: "bg-cream-2" },
    { label: "هيحضروا", value: attending.length, tone: "bg-emerald-50" },
    { label: "عدد الأفراد", value: headcount, tone: "bg-amber-50" },
    { label: "مش هيحضروا", value: live.length - attending.length, tone: "bg-rose-50" },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <div className={`rounded-3xl p-5 ${s.tone}`}>
              <p className="text-xs font-semibold text-ink-soft">{s.label}</p>
              <p className="mt-1 text-4xl font-bold">{s.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <Card>
        <p className="text-sm font-bold">التوقعات</p>
        <div className="mt-4 flex justify-between text-sm font-semibold">
          <span className="text-blue-deep">ولد · {boys} ({boyPct}%)</span>
          <span className="text-pink-deep">بنت · {girls} ({100 - boyPct}%)</span>
        </div>
        <div className="mt-2 flex h-4 overflow-hidden rounded-full bg-cream" dir="rtl">
          <motion.div className="bg-blue-deep" initial={{ width: "50%" }} animate={{ width: `${boyPct}%` }} transition={{ duration: 1 }} />
          <div className="flex-1 bg-pink-deep" />
        </div>
      </Card>

      <Card>
        <p className="text-sm font-bold">شارك الدعوة</p>
        <p className="mt-1 text-xs text-ink-soft">ابعت اللينك ده للمعازيم</p>
        <div className="mt-3 flex items-center gap-2 rounded-2xl bg-cream p-2" dir="ltr">
          <span className="flex-1 truncate px-2 text-sm">{url}</span>
          <button
            onClick={async () => {
              await navigator.clipboard.writeText(url);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
            className="flex items-center gap-1 rounded-xl bg-white px-3 py-2 text-xs font-semibold shadow-sm"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <a
          href={`https://wa.me/?text=${waText}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 flex items-center justify-center gap-2 rounded-2xl bg-[#25D366] py-3 text-sm font-semibold text-white"
        >
          <MessageCircle size={16} /> شارك على واتساب
        </a>
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold">آخر الردود</p>
          <button onClick={() => onTab("guests")} className="text-xs font-semibold text-blue-deep">
            عرض الكل
          </button>
        </div>
        <div className="mt-3 divide-y divide-ink/5">
          {live.slice(0, 6).map((r) => (
            <div key={r.id} className="flex items-center justify-between py-3 text-sm">
              <span className="font-semibold">{r.name}</span>
              <span className="flex items-center gap-2 text-xs">
                <span className={`rounded-full px-2 py-0.5 ${r.guess === "boy" ? "bg-blue-soft text-blue-deep" : "bg-pink-soft text-pink-deep"}`}>
                  {r.guess === "boy" ? "ولد" : "بنت"}
                </span>
                <span className={r.attending ? "text-emerald-600" : "text-rose-500"}>{r.attending ? `حاضر (${r.guests})` : "معتذر"}</span>
              </span>
            </div>
          ))}
          {!live.length && <p className="py-6 text-center text-sm text-ink-soft">لسه مفيش ردود</p>}
        </div>
      </Card>
    </div>
  );
}

/* ---------------- guests ---------------- */

const EMPTY: Rsvp = { name: "", phone: "", attending: true, guests: 1, guess: "boy", message: "", show_message: true };

function GuestEditor({ initial, onClose, onSave }: { initial: Rsvp; onClose: () => void; onSave: (r: Rsvp) => Promise<void> }) {
  const [r, setR] = useState<Rsvp>(initial);
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof Rsvp>(k: K, v: Rsvp[K]) => setR((p) => ({ ...p, [k]: v }));
  return (
    <motion.div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-0 sm:items-center sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div
        initial={{ y: 60 }}
        animate={{ y: 0 }}
        exit={{ y: 60 }}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90svh] w-full max-w-md overflow-y-auto rounded-t-[28px] bg-white p-6 sm:rounded-[28px]"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold">{initial.id ? "تعديل" : "إضافة مدعو"}</h3>
          <button onClick={onClose} className="rounded-full bg-cream p-2">
            <X size={16} />
          </button>
        </div>
        <div className="space-y-4">
          <TextField label="الاسم" value={r.name} onChange={(v) => set("name", v)} />
          <TextField label="الموبايل" value={r.phone ?? ""} onChange={(v) => set("phone", v)} dir="ltr" />
          <div className="grid grid-cols-2 gap-2">
            {(["boy", "girl"] as Gender[]).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => set("guess", g)}
                className={`rounded-2xl py-3 text-sm font-semibold ${
                  r.guess === g ? (g === "boy" ? "bg-blue-deep text-white" : "bg-pink-deep text-white") : "bg-cream"
                }`}
              >
                {g === "boy" ? "ولد" : "بنت"}
              </button>
            ))}
          </div>
          <Toggle label="هيحضر" checked={r.attending} onChange={(v) => set("attending", v)} />
          {r.attending && (
            <TextField label="عدد الأفراد" type="number" value={String(r.guests)} onChange={(v) => set("guests", Math.max(1, Math.min(20, parseInt(v) || 1)))} dir="ltr" />
          )}
          <TextField label="الرسالة" multiline value={r.message ?? ""} onChange={(v) => set("message", v)} />
          <Toggle label="إظهار الرسالة في الموقع" checked={r.show_message} onChange={(v) => set("show_message", v)} />
        </div>
        <button
          disabled={busy || !r.name.trim()}
          onClick={async () => {
            setBusy(true);
            await onSave({ ...r, guests: r.attending ? r.guests : 0 });
            setBusy(false);
          }}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-ink py-3.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} حفظ
        </button>
      </motion.div>
    </motion.div>
  );
}

function Guests({
  data,
  token,
  reload,
  toast,
}: {
  data: AdminData;
  token: string;
  reload: () => Promise<void>;
  toast: (t: string, ok?: boolean) => void;
}) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "yes" | "no" | "boy" | "girl" | "deleted">("all");
  const [editing, setEditing] = useState<Rsvp | null>(null);

  const rows = useMemo(() => {
    return data.rsvps.filter((r) => {
      if (filter === "deleted") {
        if (!r.deleted) return false;
      } else if (r.deleted) return false;
      if (filter === "yes" && !r.attending) return false;
      if (filter === "no" && r.attending) return false;
      if ((filter === "boy" || filter === "girl") && r.guess !== filter) return false;
      const s = q.trim().toLowerCase();
      return !s || r.name.toLowerCase().includes(s) || (r.phone ?? "").includes(s) || (r.message ?? "").toLowerCase().includes(s);
    });
  }, [data.rsvps, q, filter]);

  async function act(fn: () => Promise<unknown>, ok: string) {
    try {
      await fn();
      await reload();
      toast(ok);
    } catch (e) {
      toast(errText(e), false);
    }
  }

  function exportCsv() {
    const head = ["Name", "Phone", "Attending", "Guests", "Guess", "Message", "Date"];
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const lines = data.rsvps
      .filter((r) => !r.deleted)
      .map((r) => [r.name, r.phone, r.attending ? "Yes" : "No", r.guests, r.guess, r.message, r.created_at?.slice(0, 16).replace("T", " ")].map(esc).join(","));
    const blob = new Blob(["﻿" + [head.join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "rsvps.csv";
    a.click();
  }

  const filters: [typeof filter, string][] = [
    ["all", "الكل"],
    ["yes", "حاضرين"],
    ["no", "معتذرين"],
    ["boy", "ولد"],
    ["girl", "بنت"],
    ["deleted", "المحذوفين"],
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Search size={16} className="absolute top-1/2 -translate-y-1/2 text-ink-soft" style={{ insetInlineStart: 14 }} />
          <input className="input" style={{ paddingInlineStart: 40 }} placeholder="بحث بالاسم أو الرقم..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <button onClick={() => setEditing({ ...EMPTY })} className="flex items-center gap-1.5 rounded-2xl bg-ink px-4 py-3 text-sm font-semibold text-white">
          <Plus size={16} /> إضافة
        </button>
        <button onClick={exportCsv} className="flex items-center gap-1.5 rounded-2xl bg-white px-4 py-3 text-sm font-semibold shadow-sm ring-1 ring-ink/10">
          <Download size={16} /> Excel
        </button>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {filters.map(([f, l]) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition ${filter === f ? "bg-ink text-white" : "bg-white text-ink-soft ring-1 ring-ink/10"}`}
          >
            {l}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        <AnimatePresence initial={false}>
          {rows.map((r) => (
            <motion.div key={r.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 40 }}>
              <Card className="!p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-bold">{r.name}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                      <span className={`rounded-full px-2 py-0.5 font-semibold ${r.guess === "boy" ? "bg-blue-soft text-blue-deep" : "bg-pink-soft text-pink-deep"}`}>
                        {r.guess === "boy" ? "ولد" : "بنت"}
                      </span>
                      <span className={`rounded-full px-2 py-0.5 font-semibold ${r.attending ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-600"}`}>
                        {r.attending ? `حاضر · ${r.guests} أفراد` : "معتذر"}
                      </span>
                      {r.phone && (
                        <a href={`tel:${r.phone}`} className="text-ink-soft" dir="ltr">
                          {r.phone}
                        </a>
                      )}
                    </div>
                    {r.message && (
                      <p className={`mt-2 text-sm ${r.show_message ? "" : "text-ink-soft line-through decoration-ink/30"}`}>“{r.message}”</p>
                    )}
                    <p className="mt-1 text-[11px] text-ink-soft" dir="ltr">
                      {r.created_at ? new Date(r.created_at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    {r.deleted ? (
                      <IconBtn title="استرجاع" onClick={() => act(() => admin.removeRsvp(token, r.id!, false), "تم الاسترجاع")}>
                        <RotateCcw size={16} />
                      </IconBtn>
                    ) : (
                      <>
                        {r.message && (
                          <IconBtn
                            title={r.show_message ? "إخفاء الرسالة" : "إظهار الرسالة"}
                            onClick={() => act(() => admin.saveRsvp(token, { ...r, show_message: !r.show_message }), "تم")}
                          >
                            {r.show_message ? <Eye size={16} /> : <EyeOff size={16} />}
                          </IconBtn>
                        )}
                        <IconBtn title="تعديل" onClick={() => setEditing(r)}>
                          <Pencil size={16} />
                        </IconBtn>
                        <IconBtn
                          title="حذف"
                          danger
                          onClick={() => {
                            if (confirm(`حذف رد "${r.name}"؟ (تقدر تسترجعه من المحذوفين)`)) act(() => admin.removeRsvp(token, r.id!, true), "تم الحذف");
                          }}
                        >
                          <Trash2 size={16} />
                        </IconBtn>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
        {!rows.length && <p className="py-10 text-center text-sm text-ink-soft">مفيش نتايج</p>}
      </div>

      <AnimatePresence>
        {editing && (
          <GuestEditor
            initial={editing}
            onClose={() => setEditing(null)}
            onSave={async (r) => {
              const { created_at: _c, deleted: _d, ...payload } = r;
              await act(() => admin.saveRsvp(token, payload), "تم الحفظ");
              setEditing(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function IconBtn({ children, onClick, title, danger }: { children: React.ReactNode; onClick: () => void; title: string; danger?: boolean }) {
  return (
    <button
      title={title}
      aria-label={title}
      onClick={onClick}
      className={`rounded-xl p-2.5 transition active:scale-90 ${danger ? "bg-rose-50 text-rose-600" : "bg-cream text-ink"}`}
    >
      {children}
    </button>
  );
}

/* ---------------- content ---------------- */

function toLocalInput(iso: string) {
  // "2026-11-28T16:00:00+02:00" -> date "2026-11-28", time "16:00", offset "+02:00"
  const m = iso.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})(?::\d{2})?(?:\.\d+)?([+-]\d{2}:\d{2}|Z)?$/);
  return m ? { date: m[1], time: m[2], offset: m[3] && m[3] !== "Z" ? m[3] : "+00:00" } : { date: "", time: "16:00", offset: "+02:00" };
}

function Content({ data, token, reload, toast }: { data: AdminData; token: string; reload: () => Promise<void>; toast: (t: string, ok?: boolean) => void }) {
  const [s, setS] = useState<Settings>(data.settings);
  const [busy, setBusy] = useState(false);
  const dirty = JSON.stringify(s) !== JSON.stringify(data.settings);
  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => setS((p) => ({ ...p, [k]: v }));
  const dt = toLocalInput(s.event_date);
  const setDt = (p: Partial<typeof dt>) => {
    const n = { ...dt, ...p };
    set("event_date", `${n.date}T${n.time}:00${n.offset}`);
  };

  async function save() {
    setBusy(true);
    try {
      await admin.updateSettings(token, s);
      await reload();
      toast("تم حفظ التعديلات ✓");
    } catch (e) {
      toast(errText(e), false);
    } finally {
      setBusy(false);
    }
  }

  function switchLanguage(lang: "en" | "ar") {
    if (lang === s.language) return;
    const fill = confirm(
      lang === "ar"
        ? "تحويل الدعوة للعربي. تحب نملأ النصوص بنصوص عربية جاهزة؟ (تقدر تعدلها بعد كده)"
        : "Switch the invitation to English. Fill texts with ready English defaults? (you can edit them after)",
    );
    if (fill) {
      const def = DEFAULT_CONTENT[lang];
      setS((p) => ({
        ...p,
        language: lang,
        intro_line: def.intro_line,
        title: def.title,
        tagline: def.tagline,
        dress_code: def.dress_code,
        closing_note: def.closing_note,
        baby_name: def.baby_name,
        parents: def.parents,
      }));
    } else set("language", lang);
  }

  return (
    <div className="space-y-5 pb-24">
      <Card>
        <p className="mb-3 text-sm font-bold">لغة الدعوة</p>
        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-cream p-1">
          {(["ar", "en"] as const).map((l) => (
            <button key={l} onClick={() => switchLanguage(l)} className={`rounded-xl py-2.5 text-sm font-semibold ${s.language === l ? "bg-white shadow" : "text-ink-soft"}`}>
              {l === "ar" ? "العربية" : "English"}
            </button>
          ))}
        </div>
      </Card>

      <Card className="space-y-4">
        <p className="text-sm font-bold">نص الدعوة</p>
        <TextField label="السطر الأول" value={s.intro_line} onChange={(v) => set("intro_line", v)} />
        <TextField label="العنوان الرئيسي" value={s.title} onChange={(v) => set("title", v)} />
        <TextField label="اسم البيبي / العائلة" value={s.baby_name} onChange={(v) => set("baby_name", v)} hint="مثال: Baby Ahmed أو بيبي عائلة أحمد" />
        <TextField label="الجملة التعريفية" multiline value={s.tagline} onChange={(v) => set("tagline", v)} />
        <TextField label="من (أسماء الأب والأم)" value={s.parents} onChange={(v) => set("parents", v)} />
        <TextField label="جملة الختام" value={s.closing_note} onChange={(v) => set("closing_note", v)} />
      </Card>

      <Card className="space-y-4">
        <p className="text-sm font-bold">تفاصيل الحفلة</p>
        <div className="grid grid-cols-2 gap-3">
          <TextField label="التاريخ" type="date" value={dt.date} onChange={(v) => setDt({ date: v })} dir="ltr" />
          <TextField label="الساعة" type="time" value={dt.time} onChange={(v) => setDt({ time: v })} dir="ltr" />
        </div>
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-ink-soft">المنطقة الزمنية</span>
          <select className="input" value={dt.offset} onChange={(e) => setDt({ offset: e.target.value })} dir="ltr">
            <option value="+02:00">مصر (GMT+2)</option>
            <option value="+03:00">مصر صيفي / السعودية / الكويت (GMT+3)</option>
            <option value="+04:00">الإمارات (GMT+4)</option>
            <option value="+00:00">GMT</option>
            <option value="+01:00">GMT+1</option>
          </select>
        </label>
        <TextField label="اسم المكان" value={s.venue} onChange={(v) => set("venue", v)} />
        <TextField label="العنوان" value={s.address} onChange={(v) => set("address", v)} />
        <TextField label="لينك جوجل ماب (اختياري)" value={s.map_url} onChange={(v) => set("map_url", v)} dir="ltr" hint="لو سبته فاضي هنعمل بحث تلقائي باسم المكان" />
        <TextField label="اللبس / Dress code" value={s.dress_code} onChange={(v) => set("dress_code", v)} hint="سيبه فاضي لو مش عايزه يظهر" />
        <TextField label="آخر ميعاد لتأكيد الحضور" type="date" value={s.rsvp_deadline} onChange={(v) => set("rsvp_deadline", v)} dir="ltr" />
      </Card>

      <Card className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold">معلومات إضافية</p>
          <button onClick={() => set("extras", [...s.extras, { title: "", text: "" }])} className="flex items-center gap-1 rounded-xl bg-cream px-3 py-2 text-xs font-semibold">
            <Plus size={14} /> إضافة كارت
          </button>
        </div>
        <p className="text-xs text-ink-soft">زي: الباركينج، هدايا، رقم للتواصل... أي حاجة عايز تضيفها للدعوة</p>
        {s.extras.map((x, i) => (
          <div key={i} className="space-y-2 rounded-2xl bg-cream p-3">
            <div className="flex gap-2">
              <input className="input" placeholder="العنوان" value={x.title} onChange={(e) => set("extras", s.extras.map((y, j) => (j === i ? { ...y, title: e.target.value } : y)))} />
              <button onClick={() => set("extras", s.extras.filter((_, j) => j !== i))} className="rounded-xl bg-rose-50 px-3 text-rose-600" aria-label="حذف">
                <Trash2 size={16} />
              </button>
            </div>
            <textarea className="input" placeholder="النص" value={x.text} onChange={(e) => set("extras", s.extras.map((y, j) => (j === i ? { ...y, text: e.target.value } : y)))} />
          </div>
        ))}
      </Card>

      <Card className="space-y-2">
        <p className="mb-2 text-sm font-bold">أقسام الموقع</p>
        <Toggle label="استقبال تأكيدات الحضور" checked={s.rsvp_open} onChange={(v) => set("rsvp_open", v)} />
        <Toggle label="إظهار نسب التصويت للمعازيم" hint="لو قفلتها النتايج هتفضل سر" checked={s.show_results} onChange={(v) => set("show_results", v)} />
        <Toggle label="إظهار رسائل المعازيم" checked={s.show_wishes} onChange={(v) => set("show_wishes", v)} />
        <Toggle label="العد التنازلي" checked={s.show_countdown} onChange={(v) => set("show_countdown", v)} />
        <Toggle label="قسم التفاصيل" checked={s.show_details} onChange={(v) => set("show_details", v)} />
        <Toggle label="قسم Boy or Girl والدببة" checked={s.show_vote} onChange={(v) => set("show_vote", v)} />
        <Toggle label="طلب رقم الموبايل في الفورم" checked={s.ask_phone} onChange={(v) => set("ask_phone", v)} />
      </Card>

      <AnimatePresence>
        {dirty && (
          <motion.div
            initial={{ y: 80 }}
            animate={{ y: 0 }}
            exit={{ y: 80 }}
            className="fixed inset-x-0 bottom-20 z-40 flex justify-center gap-2 px-4 md:bottom-6"
          >
            <button onClick={() => setS(data.settings)} className="rounded-full bg-white px-5 py-3.5 text-sm font-semibold shadow-lg ring-1 ring-ink/10">
              إلغاء
            </button>
            <button onClick={save} disabled={busy} className="flex items-center gap-2 rounded-full bg-ink px-7 py-3.5 text-sm font-semibold text-white shadow-lg">
              {busy ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} حفظ التعديلات
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---------------- reveal ---------------- */

function Reveal({ data, token, reload, toast }: { data: AdminData; token: string; reload: () => Promise<void>; toast: (t: string, ok?: boolean) => void }) {
  const [gender, setGender] = useState<Gender | null>(data.secret_gender);
  const [busy, setBusy] = useState(false);
  const [hidden, setHidden] = useState(true);
  const live = data.rsvps.filter((r) => !r.deleted);
  const right = gender ? live.filter((r) => r.guess === gender) : [];

  async function apply(revealed: boolean) {
    if (revealed && !confirm("متأكد؟ الموقع هيعرض النوع لكل الناس فوراً 🎉")) return;
    setBusy(true);
    try {
      await admin.setReveal(token, gender, revealed);
      await reload();
      toast(revealed ? "تم كشف النوع 🎉" : "تم الحفظ ✓");
    } catch (e) {
      toast(errText(e), false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <Card>
        <p className="text-sm font-bold">النوع (سري)</p>
        <p className="mt-1 text-xs text-ink-soft">محدش هيشوفه غيرك لحد ما تدوس كشف. الموقع مش بيبعته للمعازيم خالص قبل الكشف.</p>
        <div className="relative mt-4 grid grid-cols-2 gap-3">
          {(["boy", "girl"] as Gender[]).map((g) => (
            <button
              key={g}
              onClick={() => setGender(g)}
              className={`rounded-3xl py-6 text-lg font-bold transition ${
                gender === g ? (g === "boy" ? "bg-blue-deep text-white" : "bg-pink-deep text-white") : "bg-cream"
              } ${hidden ? "blur-md" : ""}`}
            >
              {g === "boy" ? "ولد 💙" : "بنت 💗"}
            </button>
          ))}
          {hidden && (
            <button onClick={() => setHidden(false)} className="absolute inset-0 flex items-center justify-center gap-2 rounded-3xl text-sm font-semibold">
              <Eye size={16} /> اضغط للإظهار
            </button>
          )}
        </div>
        <button
          onClick={() => apply(data.revealed)}
          disabled={busy || gender === data.secret_gender}
          className="mt-4 w-full rounded-full bg-ink py-3.5 text-sm font-semibold text-white disabled:opacity-40"
        >
          حفظ النوع بدون كشف
        </button>
      </Card>

      <Card className={data.revealed ? "ring-2 ring-emerald-400" : ""}>
        <p className="text-sm font-bold">{data.revealed ? "✅ النوع مكشوف دلوقتي في الموقع" : "كشف النوع للجميع"}</p>
        <p className="mt-1 text-xs text-ink-soft">
          عند الكشف: الموقع هيعرض &quot;It&apos;s a Boy/Girl!&quot; بأنيميشن وكونفيتي، ويقفل فورم التخمين، ويعرض عدد اللي خمنوا صح.
        </p>
        {gender && !hidden && (
          <p className="mt-3 rounded-2xl bg-cream p-3 text-sm">
            خمّنوا صح: <b>{right.length}</b> من {live.length}
            {right.length > 0 && <span className="block pt-1 text-xs text-ink-soft">{right.map((r) => r.name).join("، ")}</span>}
          </p>
        )}
        {data.revealed ? (
          <button onClick={() => apply(false)} disabled={busy} className="mt-4 w-full rounded-full bg-white py-3.5 text-sm font-semibold ring-1 ring-ink/15">
            إلغاء الكشف (إخفاء تاني)
          </button>
        ) : (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => apply(true)}
            disabled={busy || !gender}
            className="mt-4 w-full rounded-full bg-gradient-to-r from-pink-deep to-blue-deep py-4 text-sm font-bold text-white shadow-lg disabled:opacity-40"
          >
            🎉 اكشف النوع الآن
          </motion.button>
        )}
      </Card>
    </div>
  );
}

/* ---------------- security ---------------- */

function Security({ token, toast }: { token: string; toast: (t: string, ok?: boolean) => void }) {
  const [oldPw, setOld] = useState("");
  const [newPw, setNew] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <Card className="space-y-4">
      <p className="text-sm font-bold">تغيير كلمة السر</p>
      <TextField label="كلمة السر الحالية" type="password" value={oldPw} onChange={setOld} dir="ltr" />
      <TextField label="كلمة السر الجديدة (٨ حروف على الأقل)" type="password" value={newPw} onChange={setNew} dir="ltr" />
      <button
        disabled={busy || !oldPw || newPw.length < 8}
        onClick={async () => {
          setBusy(true);
          try {
            await admin.changePassword(token, oldPw, newPw);
            setOld("");
            setNew("");
            toast("تم تغيير كلمة السر ✓ (تم تسجيل خروج أي جهاز تاني)");
          } catch (e) {
            toast(errText(e), false);
          } finally {
            setBusy(false);
          }
        }}
        className="w-full rounded-full bg-ink py-3.5 text-sm font-semibold text-white disabled:opacity-40"
      >
        تغيير
      </button>
    </Card>
  );
}

/* ---------------- shell ---------------- */

export default function AdminApp() {
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [data, setData] = useState<AdminData | null>(null);
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

  const logout = useCallback(async () => {
    if (token) admin.logout(token).catch(() => {});
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {}
    setToken(null);
    setData(null);
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
    reload();
    if (!token) return;
    const id = setInterval(reload, 20000);
    return () => clearInterval(id);
  }, [token, reload]);

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

  return (
    <div className="min-h-[100svh] bg-cream" dir="rtl" style={{ fontFamily: "var(--font-arabic)" }}>
      <header className="sticky top-0 z-30 border-b border-ink/5 bg-cream/85 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Balloon color="pink" size={16} />
            <Balloon color="blue" size={16} />
            <span className="ms-1 font-bold">لوحة التحكم</span>
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

      <div className="mx-auto flex max-w-5xl gap-6 px-4 py-5">
        <nav className="sticky top-20 hidden h-fit w-52 shrink-0 space-y-1 md:block">
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

        <main className="min-w-0 flex-1 pb-24 md:pb-6">
          <h2 className="mb-4 text-xl font-bold">{TABS.find((t) => t.id === tab)?.label}</h2>
          {!data ? (
            <div className="flex justify-center py-20">
              <Loader2 className="animate-spin text-ink-soft" />
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                {tab === "overview" && <Overview data={data} onTab={setTab} />}
                {tab === "guests" && <Guests data={data} token={token} reload={reload} toast={toast} />}
                {tab === "content" && <Content data={data} token={token} reload={reload} toast={toast} />}
                {tab === "reveal" && <Reveal data={data} token={token} reload={reload} toast={toast} />}
                {tab === "security" && <Security token={token} toast={toast} />}
              </motion.div>
            </AnimatePresence>
          )}
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-ink/5 bg-white/95 backdrop-blur md:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="grid grid-cols-5">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`flex flex-col items-center gap-1 py-2.5 text-[10px] font-semibold ${tab === t.id ? "text-ink" : "text-ink-soft/70"}`}>
              <t.icon size={20} />
              {t.label}
            </button>
          ))}
        </div>
      </nav>

      <Toast msg={msg} onClose={() => setMsg(null)} />
    </div>
  );
}
