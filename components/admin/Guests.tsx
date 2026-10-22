"use client";

import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { Download, Eye, EyeOff, Loader2, Pencil, Plus, RotateCcw, Save, Search, Trash2, X } from "lucide-react";
import { admin } from "@/lib/api";
import type { AdminData, Gender, Rsvp } from "@/lib/types";
import { Card, IconBtn, TextField, Toggle, errText, type ToastFn } from "./ui";

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

export default function Guests({
  data,
  token,
  reload,
  toast,
}: {
  data: AdminData;
  token: string;
  reload: () => Promise<void>;
  toast: ToastFn;
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
