"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Archive, ArchiveRestore, Check, Copy, ExternalLink, Home, Loader2, Pencil, Plus, Settings2, X } from "lucide-react";
import { admin, mediaUrl } from "@/lib/api";
import { DEFAULT_CONTENT } from "@/lib/defaults";
import type { InvitationSummary, Lang } from "@/lib/types";
import { Card, Field, IconBtn, errText, type ToastFn } from "./ui";

const SLUG = /^[a-z0-9][a-z0-9-]{1,39}$/;

export function inviteUrl(slug: string) {
  return `${typeof window !== "undefined" ? window.location.origin : ""}/${slug}`;
}

function slugError(slug: string, taken: string[]) {
  if (!SLUG.test(slug)) return "اللينك بالإنجليزي الصغير والأرقام والشرطة فقط (٢ حرف على الأقل)";
  if (["admin", "api", "img", "og", "icon"].includes(slug)) return "الاسم ده محجوز، اختار غيره";
  if (taken.includes(slug)) return "اللينك ده مستخدم في دعوة تانية";
  return "";
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <motion.div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 sm:items-center sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div initial={{ y: 60 }} animate={{ y: 0 }} exit={{ y: 60 }} onClick={(e) => e.stopPropagation()} className="max-h-[90svh] w-full max-w-md overflow-y-auto rounded-t-[28px] bg-white p-6 sm:rounded-[28px]">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold">{title}</h3>
          <button onClick={onClose} className="rounded-full bg-cream p-2" aria-label="إغلاق">
            <X size={16} />
          </button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
}

/** Create a new invitation (blank or a copy) or rename / change the link of an existing one. */
function InviteForm({
  list,
  editing,
  token,
  onDone,
  toast,
}: {
  list: InvitationSummary[];
  editing: InvitationSummary | null;
  token: string;
  onDone: (id: string) => void;
  toast: ToastFn;
}) {
  const [name, setName] = useState(editing?.name ?? "");
  const [slug, setSlug] = useState(editing?.slug ?? `invite-${list.length + 1}`);
  const [source, setSource] = useState<string>("blank-ar"); // blank-ar | blank-en | <invitation id>
  const [busy, setBusy] = useState(false);
  const err = slugError(slug, list.filter((x) => x.id !== editing?.id).map((x) => x.slug));

  async function submit() {
    setBusy(true);
    try {
      if (editing) {
        const current = await admin.invitation(token, editing.id);
        await admin.update(token, editing.id, name, slug, current.settings);
        onDone(editing.id);
        toast("تم الحفظ ✓");
      } else {
        const blank = source.startsWith("blank-") ? DEFAULT_CONTENT[source.slice(6) as Lang] : null;
        const id = await admin.create(token, name, slug, blank, blank ? null : source);
        onDone(id);
        toast("تم إنشاء الدعوة 🎉 عدّل التصميم والتفاصيل براحتك");
      }
    } catch (e) {
      toast(e instanceof Error && e.message === "slug_taken" ? "اللينك مستخدم" : errText(e), false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <Field label="اسم الدعوة (يظهر لك في لوحة التحكم بس)">
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="مثال: دعوة عائلة أحمد" />
      </Field>
      <Field label="لينك الدعوة" hint={err || `هيبقى: ${inviteUrl(slug)}`}>
        <div className="flex items-center gap-1 rounded-[18px] border border-ink/10 bg-white px-3" dir="ltr">
          <span className="text-sm text-ink-soft">/</span>
          <input
            className="w-full bg-transparent py-3 outline-none"
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""))}
          />
        </div>
      </Field>
      {!editing && (
        <Field label="تبدأ منين؟">
          <select className="input" value={source} onChange={(e) => setSource(e.target.value)}>
            <option value="blank-ar">دعوة جديدة فاضية (عربي)</option>
            <option value="blank-en">دعوة جديدة فاضية (English)</option>
            {list.map((x) => (
              <option key={x.id} value={x.id}>
                نسخة من: {x.name} (التصميم والتفاصيل بدون المعازيم)
              </option>
            ))}
          </select>
        </Field>
      )}
      <button
        disabled={busy || !name.trim() || !!err}
        onClick={submit}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-ink py-3.5 text-sm font-semibold text-white disabled:opacity-40"
      >
        {busy ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} {editing ? "حفظ" : "إنشاء الدعوة"}
      </button>
    </div>
  );
}

export default function Invitations({
  list,
  selectedId,
  token,
  onSelect,
  reload,
  toast,
}: {
  list: InvitationSummary[];
  selectedId: string | null;
  token: string;
  onSelect: (id: string, openTab?: "overview" | "design") => void;
  reload: () => Promise<void>;
  toast: ToastFn;
}) {
  const [form, setForm] = useState<{ editing: InvitationSummary | null } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  async function act(fn: () => Promise<unknown>, ok: string) {
    try {
      await fn();
      await reload();
      toast(ok);
    } catch (e) {
      toast(e instanceof Error && e.message === "home_cannot_archive" ? "مينفعش تأرشف الدعوة الرئيسية، خلّي دعوة تانية رئيسية الأول" : errText(e), false);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold">كل دعواتك في موقع واحد</p>
            <p className="mt-1 text-xs text-ink-soft">كل دعوة ليها لينك وتصميم وتفاصيل ومعازيم منفصلين. الرئيسية بتفتح على اللينك الأساسي للموقع.</p>
          </div>
          <button onClick={() => setForm({ editing: null })} className="flex items-center gap-1.5 rounded-2xl bg-ink px-4 py-3 text-sm font-semibold text-white">
            <Plus size={16} /> دعوة جديدة
          </button>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        {list.map((inv) => {
          const selected = inv.id === selectedId;
          const pink = inv.theme?.pink ?? "#e0789a";
          const blue = inv.theme?.blue ?? "#5d90d3";
          return (
            <motion.div key={inv.id} layout className={`overflow-hidden rounded-3xl bg-white ring-2 transition ${selected ? "ring-ink" : "ring-transparent"} ${inv.archived ? "opacity-60" : ""}`}>
              <button onClick={() => onSelect(inv.id, "overview")} className="relative block h-36 w-full overflow-hidden" style={{ background: `linear-gradient(90deg, ${pink}55, ${inv.theme?.bg ?? "#fbf6f0"}, ${blue}55)` }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={inv.frame ? mediaUrl(inv.frame) : "/img/frame.webp"} alt="" className="mx-auto h-full object-contain p-2" loading="lazy" />
                <div className="absolute start-3 top-3 flex gap-1">
                  {inv.is_home && <span className="rounded-full bg-ink px-2 py-0.5 text-[10px] font-bold text-white">الرئيسية</span>}
                  {inv.archived && <span className="rounded-full bg-ink/60 px-2 py-0.5 text-[10px] font-bold text-white">مؤرشفة</span>}
                  {selected && <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white">بتعدّل فيها</span>}
                </div>
              </button>
              <div className="p-4">
                <p className="font-bold">{inv.name}</p>
                <p className="mt-0.5 truncate text-xs text-ink-soft" dir="ltr">
                  /{inv.slug}
                </p>
                <p className="mt-2 text-xs text-ink-soft">
                  {inv.responses} رد · {inv.attending} فرد حاضر
                </p>
                <div className="mt-3 flex flex-wrap gap-1">
                  <button onClick={() => onSelect(inv.id, "design")} className="flex items-center gap-1 rounded-xl bg-ink px-3 py-2 text-xs font-semibold text-white">
                    <Pencil size={13} /> تعديل
                  </button>
                  <IconBtn
                    title="نسخ اللينك"
                    onClick={async () => {
                      await navigator.clipboard.writeText(inviteUrl(inv.slug));
                      setCopied(inv.id);
                      setTimeout(() => setCopied(null), 1500);
                    }}
                  >
                    {copied === inv.id ? <Check size={14} /> : <Copy size={14} />}
                  </IconBtn>
                  <a href={`/${inv.slug}`} target="_blank" className="rounded-xl bg-cream p-2.5" title="فتح الدعوة" aria-label="فتح الدعوة">
                    <ExternalLink size={14} />
                  </a>
                  <IconBtn title="الاسم واللينك" onClick={() => setForm({ editing: inv })}>
                    <Settings2 size={14} />
                  </IconBtn>
                  {!inv.is_home && (
                    <IconBtn title="خليها الرئيسية" onClick={() => act(() => admin.setHome(token, inv.id), "بقت الدعوة الرئيسية ✓")}>
                      <Home size={14} />
                    </IconBtn>
                  )}
                  {!inv.is_home && (
                    <IconBtn
                      title={inv.archived ? "استرجاع" : "أرشفة (إيقاف اللينك)"}
                      onClick={() => {
                        if (inv.archived || confirm(`أرشفة "${inv.name}"؟ اللينك هيقف لحد ما تسترجعها، والردود محفوظة.`))
                          act(() => admin.archive(token, inv.id, !inv.archived), inv.archived ? "تم الاسترجاع" : "تمت الأرشفة");
                      }}
                    >
                      {inv.archived ? <ArchiveRestore size={14} /> : <Archive size={14} />}
                    </IconBtn>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {form && (
          <Modal title={form.editing ? "الاسم واللينك" : "دعوة جديدة"} onClose={() => setForm(null)}>
            <InviteForm
              list={list}
              editing={form.editing}
              token={token}
              toast={toast}
              onDone={async (id) => {
                setForm(null);
                await reload();
                if (!form.editing) onSelect(id, "design");
              }}
            />
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}
