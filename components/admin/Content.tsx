"use client";

import { useMemo, useState } from "react";
import { Check, ChevronDown, Loader2, MapPin, Plus, Search, Trash2 } from "lucide-react";
import type { Lang, Settings } from "@/lib/types";
import { DEFAULT_CONTENT } from "@/lib/defaults";
import { dict } from "@/lib/i18n";
import { embedUrl } from "@/lib/maps";
import { Card, Field, TextField, Toggle } from "./ui";

type Setter = <K extends keyof Settings>(k: K, v: Settings[K]) => void;

const TIMEZONES = [
  ["+03:00", "السعودية / الكويت (GMT+3)"],
  ["+02:00", "مصر (GMT+2)"],
  ["+04:00", "الإمارات (GMT+4)"],
  ["+00:00", "GMT"],
];

function splitIso(iso: string) {
  const m = iso.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})(?::\d{2})?(?:\.\d+)?([+-]\d{2}:\d{2}|Z)?$/);
  return m ? { date: m[1], time: m[2], offset: m[3] && m[3] !== "Z" ? m[3] : "+00:00" } : { date: "", time: "20:00", offset: "+03:00" };
}

function LocationCard({ s, set }: { s: Settings; set: Setter }) {
  const [state, setState] = useState<"idle" | "busy" | "ok" | "fail">(s.map_point || s.map_query ? "ok" : "idle");

  async function resolve(url = s.map_url) {
    if (!url) return;
    setState("busy");
    try {
      const res = await fetch(`/api/resolve-map?url=${encodeURIComponent(url.trim())}`);
      const body = await res.json();
      set("map_point", body.point ?? null);
      set("map_query", body.query ?? "");
      setState(body.point || body.query ? "ok" : "fail");
    } catch {
      setState("fail");
    }
  }

  return (
    <Card title="اللوكيشن على الخريطة" hint="الصق أي لينك من جوجل ماب (حتى المختصر) والخريطة التفاعلية هتتعمل لوحدها">
      <div className="space-y-3">
        <div className="flex gap-2">
          <input
            className="input"
            dir="ltr"
            placeholder="https://maps.app.goo.gl/..."
            value={s.map_url}
            onChange={(e) => {
              set("map_url", e.target.value);
              setState("idle");
            }}
            onBlur={() => state === "idle" && resolve()}
          />
          <button onClick={() => resolve()} className="flex shrink-0 items-center gap-1 rounded-2xl bg-ink px-4 text-sm font-semibold text-white">
            {state === "busy" ? <Loader2 size={16} className="animate-spin" /> : <MapPin size={16} />} تحديد
          </button>
        </div>
        {state === "ok" && (s.map_point || s.map_query) && (
          <p className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
            <Check size={14} /> تم تحديد المكان: {s.map_point ? `${s.map_point.lat.toFixed(5)}, ${s.map_point.lng.toFixed(5)}` : s.map_query}
          </p>
        )}
        {state === "fail" && <p className="text-xs text-rose-600">معرفناش نقرأ المكان من اللينك ده، هنستخدم اسم المكان والعنوان في الخريطة بدلاً منه.</p>}
        <div className="overflow-hidden rounded-2xl ring-1 ring-ink/10">
          <iframe title="map" src={embedUrl(s, "ar")} className="h-56 w-full border-0" loading="lazy" />
        </div>
      </div>
    </Card>
  );
}

function LabelsCard({ s, set }: { s: Settings; set: Setter }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const lang = s.language;
  const base = dict[lang] as Record<string, string>;
  const overrides = s.labels[lang] ?? {};
  const keys = useMemo(
    () => Object.keys(base).filter((k) => !q || base[k].toLowerCase().includes(q.toLowerCase()) || (overrides[k] ?? "").includes(q)),
    [base, overrides, q],
  );

  const change = (k: string, v: string) => {
    const next = { ...overrides, [k]: v };
    if (!v) delete next[k];
    set("labels", { ...s.labels, [lang]: next });
  };

  return (
    <Card>
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between">
        <span className="text-start">
          <span className="block text-sm font-bold">كل نصوص الموقع</span>
          <span className="block text-xs text-ink-soft">زرار، عناوين، رسائل… عدّل أي كلمة بتظهر للمعازيم ({Object.keys(overrides).length} متعدّل)</span>
        </span>
        <ChevronDown size={18} className={`transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="mt-4 space-y-3">
          <div className="relative">
            <Search size={16} className="absolute top-1/2 -translate-y-1/2 text-ink-soft" style={{ insetInlineStart: 14 }} />
            <input className="input" style={{ paddingInlineStart: 40 }} placeholder="دوّر على نص..." value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          {keys.map((k) => (
            <Field key={k} label={base[k]}>
              <input className="input" placeholder={base[k]} value={overrides[k] ?? ""} onChange={(e) => change(k, e.target.value)} dir="auto" />
            </Field>
          ))}
        </div>
      )}
    </Card>
  );
}

export default function Content({ s, set, setS }: { s: Settings; set: Setter; setS: (fn: (p: Settings) => Settings) => void }) {
  const dt = splitIso(s.event_date);
  const setDt = (p: Partial<typeof dt>) => {
    const n = { ...dt, ...p };
    set("event_date", `${n.date}T${n.time}:00${n.offset}`);
  };

  function switchLanguage(lang: Lang) {
    if (lang === s.language) return;
    const fill = confirm(
      lang === "ar"
        ? "تحويل الدعوة للعربي. تحب نترجم النصوص الأساسية لنصوص عربية جاهزة؟ (تقدر تعدلها بعد كده)"
        : "Switch to English. Replace the main texts with ready English versions? (you can edit them after)",
    );
    const def = DEFAULT_CONTENT[lang];
    setS((p) => ({
      ...p,
      language: lang,
      ...(fill && {
        intro_line: def.intro_line,
        title: def.title,
        tagline: def.tagline,
        venue: def.venue,
        address: def.address,
        directions: def.directions,
        dress_code: def.dress_code,
        prize: def.prize,
        closing_note: def.closing_note,
        baby_name: def.baby_name,
        parents: def.parents,
      }),
    }));
  }

  return (
    <div className="space-y-5">
      <Card title="لغة الدعوة">
        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-cream p-1">
          {(["ar", "en"] as const).map((l) => (
            <button key={l} onClick={() => switchLanguage(l)} className={`rounded-xl py-2.5 text-sm font-semibold ${s.language === l ? "bg-white shadow" : "text-ink-soft"}`}>
              {l === "ar" ? "العربية" : "English"}
            </button>
          ))}
        </div>
      </Card>

      <Card title="نص الدعوة" className="space-y-4">
        <div className="space-y-4">
          <TextField label="السطر الأول" value={s.intro_line} onChange={(v) => set("intro_line", v)} />
          <TextField label="العنوان الرئيسي" value={s.title} onChange={(v) => set("title", v)} />
          <TextField label="اسم البيبي / العائلة" value={s.baby_name} onChange={(v) => set("baby_name", v)} hint="بيظهر بخط مزخرف في نص الكارت" />
          <TextField label="الجملة التعريفية" multiline value={s.tagline} onChange={(v) => set("tagline", v)} />
          <TextField label="من (أسماء الأب والأم)" value={s.parents} onChange={(v) => set("parents", v)} />
          <TextField label="جملة الختام" value={s.closing_note} onChange={(v) => set("closing_note", v)} />
        </div>
      </Card>

      <Card title="تفاصيل الحفلة">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <TextField label="التاريخ" type="date" value={dt.date} onChange={(v) => setDt({ date: v })} dir="ltr" />
            <TextField label="الساعة" type="time" value={dt.time} onChange={(v) => setDt({ time: v })} dir="ltr" />
          </div>
          <Field label="المنطقة الزمنية">
            <select className="input" value={dt.offset} onChange={(e) => setDt({ offset: e.target.value })}>
              {TIMEZONES.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </Field>
          <TextField label="اسم المكان" value={s.venue} onChange={(v) => set("venue", v)} />
          <TextField label="العنوان" value={s.address} onChange={(v) => set("address", v)} />
          <TextField label="طريقة الوصول / الدخول" value={s.directions} onChange={(v) => set("directions", v)} hint="مثال: الدخول من بوابة ٥" />
          <TextField label="الدريس كود" value={s.dress_code} onChange={(v) => set("dress_code", v)} hint="سيبه فاضي لو مش عايزه يظهر" />
          <TextField label="جائزة التخمين الصح" value={s.prize} onChange={(v) => set("prize", v)} hint="بتظهر جنب التصويت وبعد ما الضيف يبعت تخمينه" />
          <TextField label="آخر ميعاد لتأكيد الحضور (اختياري)" type="date" value={s.rsvp_deadline} onChange={(v) => set("rsvp_deadline", v)} dir="ltr" />
        </div>
      </Card>

      <LocationCard s={s} set={set} />

      <Card title="كروت معلومات إضافية" hint="باركينج، رقم للتواصل، هدايا… أي معلومة عايز تضيفها">
        <div className="space-y-3">
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
          <button onClick={() => set("extras", [...s.extras, { title: "", text: "" }])} className="flex w-full items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-ink/15 py-3 text-sm font-semibold text-ink-soft">
            <Plus size={16} /> إضافة كارت
          </button>
        </div>
      </Card>

      <Card title="إعدادات تأكيد الحضور">
        <div className="space-y-2">
          <Toggle label="استقبال تأكيدات الحضور" checked={s.rsvp_open} onChange={(v) => set("rsvp_open", v)} />
          <Toggle label="إظهار نسب التصويت للمعازيم" hint="لو قفلتها النتايج هتفضل سر لحد الكشف" checked={s.show_results} onChange={(v) => set("show_results", v)} />
          <Toggle label="طلب رقم الموبايل في الفورم" checked={s.ask_phone} onChange={(v) => set("ask_phone", v)} />
        </div>
      </Card>

      <LabelsCard s={s} set={set} />
    </div>
  );
}
