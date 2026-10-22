"use client";

import { motion } from "motion/react";
import { useState } from "react";
import { Check, Copy, MessageCircle } from "lucide-react";
import type { AdminData } from "@/lib/types";
import { Card } from "./ui";
import type { Tab } from "./AdminApp";
import { shareUrl } from "./Invitations";

/* ---------------- overview ---------------- */

export default function Overview({ data, onTab }: { data: AdminData; onTab: (t: Tab) => void }) {
  const live = data.rsvps.filter((r) => !r.deleted);
  const attending = live.filter((r) => r.attending);
  const headcount = attending.reduce((a, r) => a + r.guests, 0);
  const boys = live.filter((r) => r.guess === "boy").length;
  const girls = live.filter((r) => r.guess === "girl").length;
  const total = boys + girls;
  const boyPct = total ? Math.round((boys / total) * 100) : 50;
  const [copied, setCopied] = useState(false);
  const url = shareUrl(data.invitation);
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

