"use client";

import { useState } from "react";
import { admin } from "@/lib/api";
import { Card, TextField, errText, type ToastFn } from "./ui";

/* ---------------- security ---------------- */

export default function Security({ token, toast }: { token: string; toast: ToastFn }) {
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

