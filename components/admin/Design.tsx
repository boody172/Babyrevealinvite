"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Eye, EyeOff, ImageUp, Images, Loader2, RotateCcw, X } from "lucide-react";
import type { CardLayout, ImageKey, MediaItem, Settings, Theme } from "@/lib/types";
import { DEFAULT_THEME, FONTS, PRESETS } from "@/lib/theme";
import { SECTION_LABELS } from "@/lib/defaults";
import { admin, imageUrl, mediaUrl } from "@/lib/api";
import { compressImage } from "@/lib/image";
import { Card, Field, IconBtn, Toggle, errText, type ToastFn } from "./ui";

type Setter = <K extends keyof Settings>(k: K, v: Settings[K]) => void;

const COLORS: [keyof Theme, string][] = [
  ["pink", "لون البنت"],
  ["blue", "لون الولد"],
  ["gold", "اللون الذهبي"],
  ["ink", "لون الكلام"],
  ["bg", "الخلفية"],
];

const IMAGES: { key: ImageKey; label: string; width: number }[] = [
  { key: "frame", label: "كارت الدعوة (الإطار)", width: 1400 },
  { key: "bear_boy", label: "دبدوب الولد", width: 600 },
  { key: "bear_girl", label: "دبدوب البنت", width: 600 },
  { key: "scene", label: "صورة آخر الصفحة", width: 1400 },
];

function MediaPicker({ token, onPick, onClose }: { token: string; onPick: (id: string) => void; onClose: () => void }) {
  const [items, setItems] = useState<MediaItem[] | null>(null);
  useEffect(() => {
    admin.media(token).then(setItems, () => setItems([]));
  }, [token]);
  return (
    <motion.div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 sm:items-center sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div initial={{ y: 60 }} animate={{ y: 0 }} onClick={(e) => e.stopPropagation()} className="max-h-[85svh] w-full max-w-2xl overflow-y-auto rounded-t-[28px] bg-white p-5 sm:rounded-[28px]">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold">مكتبة الصور</h3>
          <button onClick={onClose} className="rounded-full bg-cream p-2" aria-label="إغلاق">
            <X size={16} />
          </button>
        </div>
        {!items ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <p className="py-10 text-center text-sm text-ink-soft">المكتبة فاضية. ارفع أول صورة بزرار «رفع جديدة».</p>
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {items.map((m) => (
              <button key={m.id} onClick={() => onPick(m.id)} className="group overflow-hidden rounded-2xl bg-cream p-1 ring-2 ring-transparent transition hover:ring-ink">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={mediaUrl(m.id)} alt={m.label} className="aspect-square w-full rounded-xl object-contain" loading="lazy" />
                <p className="truncate px-1 pt-1 text-[10px] text-ink-soft">{m.label || "صورة"}</p>
              </button>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

function ImageSlot({ s, set, token, toast, item }: { s: Settings; set: Setter; token: string; toast: ToastFn; item: (typeof IMAGES)[number] }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [picking, setPicking] = useState(false);

  async function upload(file: File) {
    setBusy(true);
    try {
      const { mime, base64 } = await compressImage(file, item.width);
      const id = await admin.uploadMedia(token, `${item.label} · ${file.name}`.slice(0, 80), mime, base64);
      set("images", { ...s.images, [item.key]: id });
      toast("تم رفع الصورة وإضافتها للمكتبة ✓");
    } catch (e) {
      toast(e instanceof Error && e.message === "image_too_large" ? "الصورة كبيرة جداً" : errText(e), false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl bg-cream p-3">
      <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl(s, item.key)} alt={item.label} className="h-full w-full object-contain" />
        {busy && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70">
            <Loader2 className="animate-spin" />
          </div>
        )}
      </div>
      <p className="mt-2 text-xs font-semibold">{item.label}</p>
      <div className="mt-2 grid grid-cols-2 gap-1">
        <button onClick={() => input.current?.click()} className="flex items-center justify-center gap-1 rounded-xl bg-ink py-2 text-[11px] font-semibold text-white">
          <ImageUp size={13} /> رفع جديدة
        </button>
        <button onClick={() => setPicking(true)} className="flex items-center justify-center gap-1 rounded-xl bg-white py-2 text-[11px] font-semibold ring-1 ring-ink/10">
          <Images size={13} /> من المكتبة
        </button>
      </div>
      {s.images[item.key] && (
        <button onClick={() => set("images", { ...s.images, [item.key]: undefined })} className="mt-1 flex w-full items-center justify-center gap-1 py-1 text-[11px] text-ink-soft">
          <RotateCcw size={12} /> الصورة الأصلية
        </button>
      )}
      <input
        ref={input}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) upload(f);
          e.target.value = "";
        }}
      />
      <AnimatePresence>
        {picking && (
          <MediaPicker
            token={token}
            onClose={() => setPicking(false)}
            onPick={(id) => {
              set("images", { ...s.images, [item.key]: id });
              setPicking(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function Slider({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <label className="block">
      <span className="mb-1 flex justify-between text-xs font-semibold text-ink-soft">
        <span>{label}</span>
        <span dir="ltr">{value}%</span>
      </span>
      <input type="range" min={min} max={max} step={0.5} value={value} onChange={(e) => onChange(parseFloat(e.target.value))} className="w-full accent-[var(--color-ink)]" />
    </label>
  );
}

export default function Design({ s, set, token, toast }: { s: Settings; set: Setter; token: string; toast: ToastFn }) {
  const th = s.theme;
  const setTheme = (patch: Partial<Theme>) => set("theme", { ...th, ...patch });
  const setCard = (patch: Partial<CardLayout>) => setTheme({ card: { ...th.card, ...patch } });

  const move = (i: number, dir: -1 | 1) => {
    const next = [...s.sections];
    [next[i], next[i + dir]] = [next[i + dir], next[i]];
    set("sections", next);
  };

  return (
    <div className="space-y-5">
      <Card title="ثيمات جاهزة" hint="اختار ثيم وبعدها تقدر تعدّل أي لون">
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(PRESETS).map(([id, p]) => (
            <motion.button
              key={id}
              whileTap={{ scale: 0.96 }}
              onClick={() => setTheme({ preset: id, ...p.palette })}
              className={`rounded-2xl p-3 text-start ring-2 transition ${th.preset === id ? "ring-ink" : "ring-transparent"}`}
              style={{ background: p.palette.bg }}
            >
              <div className="flex gap-1">
                {[p.palette.pink, p.palette.blue, p.palette.gold, p.palette.ink].map((c) => (
                  <span key={c} className="h-6 w-6 rounded-full ring-2 ring-white" style={{ background: c }} />
                ))}
              </div>
              <p className="mt-2 text-xs font-semibold" style={{ color: p.palette.ink }}>
                {p.label}
              </p>
            </motion.button>
          ))}
        </div>
      </Card>

      <Card title="الألوان">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {COLORS.map(([k, label]) => (
            <label key={k} className="flex items-center gap-3 rounded-2xl bg-cream p-2.5">
              <input
                type="color"
                value={th[k] as string}
                onChange={(e) => setTheme({ [k]: e.target.value, preset: "custom" } as Partial<Theme>)}
                className="h-9 w-9 shrink-0 cursor-pointer rounded-full border-0 bg-transparent p-0"
              />
              <span className="text-xs font-semibold">{label}</span>
            </label>
          ))}
        </div>
      </Card>

      <Card title="الخطوط">
        <div className="space-y-3">
          <Field label="خط العناوين (إنجليزي)">
            <select className="input" value={th.heading_font} onChange={(e) => setTheme({ heading_font: e.target.value })} style={{ fontFamily: FONTS.heading[th.heading_font as keyof typeof FONTS.heading]?.css }}>
              {Object.entries(FONTS.heading).map(([k, f]) => (
                <option key={k} value={k}>
                  {f.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="الخط المزخرف (إنجليزي)">
            <select className="input" value={th.script_font} onChange={(e) => setTheme({ script_font: e.target.value })}>
              {Object.entries(FONTS.script).map(([k, f]) => (
                <option key={k} value={k}>
                  {f.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="خط العناوين العربي">
            <select className="input" value={th.arabic_font} onChange={(e) => setTheme({ arabic_font: e.target.value })}>
              {Object.entries(FONTS.arabic).map(([k, f]) => (
                <option key={k} value={k}>
                  {f.label}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </Card>

      <Card title="الحركة والزينة">
        <div className="space-y-3">
          <Field label="البالونات والنجوم الطايرة">
            <div className="grid grid-cols-3 gap-2 rounded-2xl bg-cream p-1">
              {(
                [
                  ["none", "بدون"],
                  ["soft", "خفيفة"],
                  ["full", "كاملة"],
                ] as const
              ).map(([v, l]) => (
                <button key={v} onClick={() => setTheme({ decor: v })} className={`rounded-xl py-2.5 text-sm font-semibold ${th.decor === v ? "bg-white shadow" : "text-ink-soft"}`}>
                  {l}
                </button>
              ))}
            </div>
          </Field>
          <Toggle label="شاشة فتح الهدية في البداية" hint="لو قفلتها الدعوة هتفتح على طول" checked={th.intro} onChange={(v) => setTheme({ intro: v })} />
        </div>
      </Card>

      <Card title="ترتيب أقسام الموقع" hint="رتّب الأقسام بالأسهم، واخفي أي قسم بالعين">
        <div className="space-y-2">
          {s.sections.map((sec, i) => (
            <motion.div layout key={sec.id} className={`flex items-center gap-2 rounded-2xl p-2 ps-4 ${sec.visible ? "bg-cream" : "bg-cream/50 text-ink-soft"}`}>
              <span className="w-5 text-xs font-bold text-ink-soft">{i + 1}</span>
              <span className={`flex-1 text-sm font-semibold ${sec.visible ? "" : "line-through"}`}>{SECTION_LABELS[sec.id]}</span>
              <IconBtn title="لفوق" disabled={i === 0} onClick={() => move(i, -1)}>
                <ArrowUp size={14} />
              </IconBtn>
              <IconBtn title="لتحت" disabled={i === s.sections.length - 1} onClick={() => move(i, 1)}>
                <ArrowDown size={14} />
              </IconBtn>
              <IconBtn title={sec.visible ? "إخفاء" : "إظهار"} onClick={() => set("sections", s.sections.map((x, j) => (j === i ? { ...x, visible: !x.visible } : x)))}>
                {sec.visible ? <Eye size={14} /> : <EyeOff size={14} />}
              </IconBtn>
            </motion.div>
          ))}
        </div>
      </Card>

      <Card title="الصور والخلفيات" hint="ارفع خلفية جديدة أو اختار من المكتبة (كل الصور اللي رفعتها لأي دعوة). بنضغط الصور تلقائياً عشان الموقع يفضل سريع">
        <div className="grid grid-cols-2 gap-3">
          {IMAGES.map((item) => (
            <ImageSlot key={item.key} s={s} set={set} token={token} toast={toast} item={item} />
          ))}
        </div>
      </Card>

      <Card title="مكان الكلام على كارت الدعوة" hint="لما تغيّر الخلفية، حرّك الكلام لحد ما يقعد في المساحة الفاضية (شوف المعاينة)">
        <div className="space-y-4">
          <Slider label="المسافة من فوق" value={th.card.top} min={0} max={60} onChange={(v) => setCard({ top: v })} />
          <Slider label="المسافة من تحت" value={th.card.bottom} min={0} max={60} onChange={(v) => setCard({ bottom: v })} />
          <Slider label="المسافة من الجنبين" value={th.card.side} min={2} max={35} onChange={(v) => setCard({ side: v })} />
          <Toggle label="خلفية بيضا خفيفة ورا الكلام" hint="مفيدة لو الخلفية مزدحمة والكلام مش واضح" checked={th.card.backdrop} onChange={(v) => setCard({ backdrop: v })} />
          <button onClick={() => setCard(DEFAULT_THEME.card)} className="text-xs font-semibold text-ink-soft underline">
            رجوع للمكان الأصلي
          </button>
        </div>
      </Card>
    </div>
  );
}
