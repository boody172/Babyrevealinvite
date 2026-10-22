"use client";

import { useMemo, useState } from "react";
import { Check, ChevronDown, Loader2, MapPin, Plus, Search, Trash2 } from "lucide-react";
import type { ExtraBlock, Lang, Settings, TextKey } from "@/lib/types";
import { LANG_NAMES, localize, setDefaultLanguage } from "@/lib/content";
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

function LabelsCard({ s, set, lang }: { s: Settings; set: Setter; lang: Lang }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
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

export default function Content({
  s,
  set,
  setS,
  editLang,
  setEditLang,
}: {
  s: Settings;
  set: Setter;
  setS: (fn: (p: Settings) => Settings) => void;
  editLang: Lang;
  setEditLang: (l: Lang) => void;
}) {
  const dt = splitIso(s.event_date);
  const setDt = (p: Partial<typeof dt>) => {
    const n = { ...dt, ...p };
    set("event_date", `${n.date}T${n.time}:00${n.offset}`);
  };

  // Texts are read/written in the language being edited: the default language lives at the
  // top level, every other language in `translations`.
  const lang = s.languages.includes(editLang) ? editLang : s.language;
  const isDefault = lang === s.language;
  const shown = localize(s, lang); // what guests see in this language (incl. fallbacks)
  const tr = s.translations[lang] ?? {};
  const val = (k: TextKey) => (isDefault ? s[k] : (tr[k] ?? ""));
  const put = (k: TextKey, v: string) => (isDefault ? set(k, v) : set("translations", { ...s.translations, [lang]: { ...tr, [k]: v } }));
  const extras = isDefault ? s.extras : (tr.extras ?? []);
  const putExtras = (next: ExtraBlock[]) => (isDefault ? set("extras", next) : set("translations", { ...s.translations, [lang]: { ...tr, extras: next } }));
  const text = (k: TextKey, label: string, opts: { multiline?: boolean; hint?: string } = {}) => (
    <TextField label={label} value={val(k)} onChange={(v) => put(k, v)} multiline={opts.multiline} hint={opts.hint} placeholder={isDefault ? undefined : shown[k]} dir={lang === "ar" ? "rtl" : "ltr"} />
  );

  function toggleLanguage(l: Lang) {
    if (l === s.language) return;
    const on = s.languages.includes(l);
    set("languages", on ? s.languages.filter((x) => x !== l) : [...s.languages, l]);
    if (!on) setEditLang(l);
  }

  return (
    <div className="space-y-5">
      <Card title="لغات الدعوة" hint="فعّل أكتر من لغة، وهيظهر للمعازيم زرار تحويل اللغة فوق الدعوة">
        <div className="space-y-3">
          {(["ar", "en"] as const).map((l) => (
            <div key={l} className="flex items-center gap-2 rounded-2xl bg-cream p-2 ps-4">
              <span className="flex-1 text-sm font-semibold">{LANG_NAMES[l]}</span>
              {s.language === l ? (
                <span className="rounded-full bg-ink px-3 py-1.5 text-[11px] font-bold text-white">اللغة الأساسية</span>
              ) : (
                <>
                  {s.languages.includes(l) && (
                    <button onClick={() => setS((p) => setDefaultLanguage(p, l))} className="rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold ring-1 ring-ink/10">
                      خليها الأساسية
                    </button>
                  )}
                  <button
                    onClick={() => toggleLanguage(l)}
                    className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${s.languages.includes(l) ? "bg-emerald-500 text-white" : "bg-white ring-1 ring-ink/10"}`}
                  >
                    {s.languages.includes(l) ? "مفعّلة ✓" : "تفعيل"}
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      </Card>

      {s.languages.length > 1 && (
        <div className="sticky top-16 z-20 rounded-2xl bg-cream/90 py-2 backdrop-blur">
          <p className="mb-1.5 text-xs font-semibold text-ink-soft">بتعدّل نصوص:</p>
          <div className="grid grid-cols-2 gap-2 rounded-2xl bg-white p-1 shadow-sm">
            {s.languages.map((l) => (
              <button key={l} onClick={() => setEditLang(l)} className={`rounded-xl py-2.5 text-sm font-semibold transition ${lang === l ? "bg-ink text-white" : "text-ink-soft"}`}>
                {LANG_NAMES[l]}
              </button>
            ))}
          </div>
          {!isDefault && <p className="mt-1.5 text-[11px] text-ink-soft">أي خانة تسيبها فاضية هتاخد النص الرمادي اللي فيها.</p>}
        </div>
      )}

      <Card title="نص الدعوة">
        <div className="space-y-4">
          {text("intro_line", "السطر الأول")}
          {text("title", "العنوان الرئيسي")}
          {text("baby_name", "اسم البيبي / العائلة", { hint: "بيظهر بخط مزخرف في نص الكارت" })}
          {text("tagline", "الجملة التعريفية", { multiline: true })}
          {text("parents", "من (أسماء الأب والأم)")}
          {text("closing_note", "جملة الختام")}
        </div>
      </Card>

      <Card title="تفاصيل الحفلة">
        <div className="space-y-4">
          {isDefault && (
            <>
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
            </>
          )}
          {text("venue", "اسم المكان")}
          {text("address", "العنوان")}
          {text("directions", "طريقة الوصول / الدخول", { hint: "مثال: الدخول من بوابة ٥" })}
          {text("dress_code", "الدريس كود", { hint: "سيبه فاضي لو مش عايزه يظهر" })}
          {text("prize", "جائزة التخمين الصح", { hint: "بتظهر جنب التصويت وبعد ما الضيف يبعت تخمينه" })}
          {text("video_title", "عنوان قسم الفيديو")}
          {isDefault && <TextField label="آخر ميعاد لتأكيد الحضور (اختياري)" type="date" value={s.rsvp_deadline} onChange={(v) => set("rsvp_deadline", v)} dir="ltr" />}
        </div>
      </Card>

      {isDefault && <LocationCard s={s} set={set} />}

      <Card title="كروت معلومات إضافية" hint={isDefault ? "باركينج، رقم للتواصل، هدايا… أي معلومة عايز تضيفها" : "لو سبتها فاضية هتظهر نفس كروت اللغة الأساسية"}>
        <div className="space-y-3">
          {extras.map((x, i) => (
            <div key={i} className="space-y-2 rounded-2xl bg-cream p-3">
              <div className="flex gap-2">
                <input className="input" placeholder="العنوان" value={x.title} onChange={(e) => putExtras(extras.map((y, j) => (j === i ? { ...y, title: e.target.value } : y)))} />
                <button onClick={() => putExtras(extras.filter((_, j) => j !== i))} className="rounded-xl bg-rose-50 px-3 text-rose-600" aria-label="حذف">
                  <Trash2 size={16} />
                </button>
              </div>
              <textarea className="input" placeholder="النص" value={x.text} onChange={(e) => putExtras(extras.map((y, j) => (j === i ? { ...y, text: e.target.value } : y)))} />
            </div>
          ))}
          <button
            onClick={() => putExtras([...(extras.length || isDefault ? extras : s.extras.map((x) => ({ ...x }))), { title: "", text: "" }])}
            className="flex w-full items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-ink/15 py-3 text-sm font-semibold text-ink-soft"
          >
            <Plus size={16} /> إضافة كارت
          </button>
        </div>
      </Card>

      {isDefault && (
        <Card title="إعدادات تأكيد الحضور">
          <div className="space-y-2">
            <Toggle label="استقبال تأكيدات الحضور" checked={s.rsvp_open} onChange={(v) => set("rsvp_open", v)} />
            <Toggle label="إظهار نسب التصويت للمعازيم" hint="لو قفلتها النتايج هتفضل سر لحد الكشف" checked={s.show_results} onChange={(v) => set("show_results", v)} />
            <Toggle label="طلب رقم الموبايل في الفورم" checked={s.ask_phone} onChange={(v) => set("ask_phone", v)} />
            <Toggle
              label="إظهار دخول الأدمن في قائمة الدعوة"
              hint="مقفول = الضيوف مش هيشوفوا أي دخول للوحة التحكم. إنت تدخل من /admin"
              checked={s.show_admin_login}
              onChange={(v) => set("show_admin_login", v)}
            />
          </div>
        </Card>
      )}

      <LabelsCard s={s} set={set} lang={lang} />
    </div>
  );
}
