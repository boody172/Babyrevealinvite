"use client";

import { motion } from "motion/react";
import { useState } from "react";
import { Eye, EyeOff, Loader2, Lock } from "lucide-react";
import { admin } from "@/lib/api";
import { Balloon } from "@/components/invite/Decor";
import { errText } from "./ui";

export default function Login({ onLogin }: { onLogin: (token: string) => void }) {
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      onLogin(await admin.login(pw));
    } catch (e) {
      setErr(errText(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="watercolor-bg flex min-h-[100svh] items-center justify-center px-5" dir="rtl">
      <motion.form onSubmit={submit} initial={{ opacity: 0, y: 30, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="glass w-full max-w-sm rounded-[32px] p-8 text-center">
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
        <button disabled={busy || !pw} className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-ink py-3.5 text-sm font-semibold text-white transition active:scale-95 disabled:opacity-50">
          {busy && <Loader2 size={16} className="animate-spin" />} دخول
        </button>
      </motion.form>
    </main>
  );
}
