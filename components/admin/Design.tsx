"use client";

import { motion } from "motion/react";
import { useRef, useState } from "react";
import { ArrowDown, ArrowUp, Eye, EyeOff, ImageUp, Loader2, RotateCcw } from "lucide-react";
import type { ImageKey, Settings, Theme } from "@/lib/types";
import { FONTS, PRESETS } from "@/lib/theme";
import { SECTION_LABELS } from "@/lib/defaults";
import { admin, imageUrl } from "@/lib/api";
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

function ImageSlot({ s, set, token, toast, item }: { s: Settings; set: Setter; token: string; toast: ToastFn; item: (typeof IMAGES)[number] }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function upload(file: File) {
    setBusy(true);
    try {
      const { mime, base64 } = await compressImage(file, item.width);
      await admin.setAsset(token, item.key, mime, base64);
      set("images", { ...s.images, [item.key]: Date.now() });
      toast("تم رفع الصورة ✓ اضغط حفظ عشان تظهر للمعازيم");
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
      <div className="mt-2 flex gap-1">
        <button onClick={() => input.current?.click()} className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-ink py-2 text-xs font-semibold text-white">
          <ImageUp size={14} /> تغيير
        </button>
        {s.images[item.key] && (
          <IconBtn title="رجوع للصورة الأصلية" onClick={() => set("images", { ...s.images, [item.key]: undefined })}>
            <RotateCcw size={14} />
          </IconBtn>
        )}
      </div>
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
    </div>
  );
}

export default function Design({ s, set, token, toast }: { s: Settings; set: Setter; token: string; toast: ToastFn }) {
  const th = s.theme;
  const setTheme = (patch: Partial<Theme>) => set("theme", { ...th, ...patch });

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

      <Card title="الصور" hint="ارفع صورة جديدة بدل أي صورة في الدعوة (بنضغطها تلقائياً عشان الموقع يفضل سريع)">
        <div className="grid grid-cols-2 gap-3">
          {IMAGES.map((item) => (
            <ImageSlot key={item.key} s={s} set={set} token={token} toast={toast} item={item} />
          ))}
        </div>
      </Card>
    </div>
  );
}
