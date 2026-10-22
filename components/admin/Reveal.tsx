"use client";

import { motion } from "motion/react";
import { useState } from "react";
import { Eye } from "lucide-react";
import { admin } from "@/lib/api";
import type { AdminData, Gender } from "@/lib/types";
import { Card, errText, type ToastFn } from "./ui";

/* ---------------- reveal ---------------- */

export default function Reveal({ data, token, reload, toast }: { data: AdminData; token: string; reload: () => Promise<void>; toast: ToastFn }) {
  const [gender, setGender] = useState<Gender | null>(data.secret_gender);
  const [busy, setBusy] = useState(false);
  const [hidden, setHidden] = useState(true);
  const live = data.rsvps.filter((r) => !r.deleted);
  const right = gender ? live.filter((r) => r.guess === gender) : [];

  async function apply(revealed: boolean) {
    if (revealed && !confirm("متأكد؟ الموقع هيعرض النوع لكل الناس فوراً 🎉")) return;
    setBusy(true);
    try {
      await admin.reveal(token, data.invitation.id, gender, revealed);
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

