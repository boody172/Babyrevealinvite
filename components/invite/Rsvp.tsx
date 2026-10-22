"use client";

import { AnimatePresence, motion } from "motion/react";
import { forwardRef, useState } from "react";
import { Check, Minus, Plus, Send, Loader2, PartyPopper } from "lucide-react";
import confetti from "canvas-confetti";
import type { Dict } from "@/lib/i18n";
import { formatDate } from "@/lib/i18n";
import type { Gender, SiteData } from "@/lib/types";
import { submitRsvp, ApiError, imageUrl } from "@/lib/api";
import { SectionTitle, InView, PrizeBadge } from "./Sections";
import { Heart } from "./Decor";
import { Txt } from "./Txt";

export function burstConfetti(g?: Gender) {
    // confetti draws on canvas, so resolve the theme variables to real colors
  const css = getComputedStyle(document.querySelector("main") ?? document.documentElement);
  const v = (name: string) => css.getPropertyValue(name).trim() || "#c9a46a";
  const boy = [v("--color-blue-deep"), v("--color-blue"), v("--color-blue-soft")];
  const girl = [v("--color-pink-deep"), v("--color-pink"), v("--color-pink-soft")];
  const colors = [...(g === "boy" ? boy : g === "girl" ? girl : [...boy.slice(0, 2), ...girl.slice(0, 2)]), v("--color-gold"), "#ffffff"];
  const end = Date.now() + 1200;
  (function frame() {
    confetti({ particleCount: 5, angle: 60, spread: 70, origin: { x: 0, y: 0.7 }, colors, scalar: 1.1 });
    confetti({ particleCount: 5, angle: 120, spread: 70, origin: { x: 1, y: 0.7 }, colors, scalar: 1.1 });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
  confetti({ particleCount: 120, spread: 100, startVelocity: 45, origin: { y: 0.55 }, colors, shapes: ["circle", "square"] });
}

type Mine = NonNullable<SiteData["mine"]>;

const Rsvp = forwardRef<
  HTMLElement,
  {
    data: SiteData;
    d: Dict;
    device: string | null;
    slug: string;
    preview?: boolean;
    guess: Gender | null;
    setGuess: (g: Gender) => void;
    onDone: (m: Mine) => void;
  }
>(function Rsvp({ data, d, device, slug, preview, guess, setGuess, onDone }, ref) {
  const s = data.settings;
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [attending, setAttending] = useState(true);
  const [guests, setGuests] = useState(1);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mine = data.mine;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) return setError(d.errName);
    if (!guess) return setError(d.errGuess);
    if (!device && !preview) return setError(d.errGeneric);
    setBusy(true);
    try {
      // dashboard preview: show the full flow without writing a real RSVP
      if (!preview) await submitRsvp({ slug, name: name.trim(), phone, attending, guests, guess, message, device: device! });
      burstConfetti(guess);
      onDone({ name: name.trim(), guess, attending });
    } catch (err) {
      const m = err instanceof ApiError ? err.message : "";
      setError(m === "already_submitted" ? d.errAlready : m === "rsvp_closed" ? d.rsvpClosed : d.errGeneric);
    } finally {
      setBusy(false);
    }
  }

  const deadline = s.rsvp_deadline ? formatDate(`${s.rsvp_deadline}T12:00:00+00:00`, s.language).full : "";
  const tint = guess === "boy" ? "from-blue-soft/90" : guess === "girl" ? "from-pink-soft/90" : "from-white/0";

  return (
    <section ref={ref} id="rsvp" className="relative scroll-mt-6 px-4 py-16">
      <motion.div
        className={`pointer-events-none absolute inset-0 bg-gradient-to-b ${tint} to-transparent transition-colors duration-700`}
        aria-hidden
      />
      <SectionTitle script={d.rsvpTitle} k="l:rsvpTitle" caps={deadline ? <><Txt k="l:rsvpBy">{d.rsvpBy}</Txt> {deadline}</> : undefined} />

      <InView className="relative mx-auto max-w-xl">
        <div className="glass relative overflow-hidden rounded-[32px] p-6 sm:p-9">
          <AnimatePresence mode="wait">
            {mine ? (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center py-6 text-center"
              >
                <motion.div
                  initial={{ rotate: -20, scale: 0 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.1 }}
                  className={`flex h-20 w-20 items-center justify-center rounded-full ${
                    mine.guess === "boy" ? "bg-blue-soft text-blue-deep" : "bg-pink-soft text-pink-deep"
                  }`}
                >
                  <PartyPopper size={36} strokeWidth={1.5} />
                </motion.div>
                <p className="font-script mt-4 text-5xl">
                  <Txt k="l:thanks">{d.thanks}</Txt> <bdi>{mine.name.split(" ")[0]}</bdi>!
                </p>
                <p className="mt-3 font-sans text-sm text-ink-soft">
                  <Txt k="l:thanksGuessed">{d.thanksGuessed}</Txt>{" "}
                  <span className={`font-semibold ${mine.guess === "boy" ? "text-blue-deep" : "text-pink-deep"}`}>
                    {mine.guess === "boy" ? d.boy : d.girl}
                  </span>
                </p>
                <p className="mt-2 font-serif text-xl italic">{mine.attending ? <Txt k="l:thanksAttending">{d.thanksAttending}</Txt> : <Txt k="l:thanksNotAttending">{d.thanksNotAttending}</Txt>}</p>
                {s.prize && (
                  <div className="mt-6 w-full">
                    <PrizeBadge text={s.prize} d={d} />
                  </div>
                )}
                <p className="mt-6 font-sans text-[11px] uppercase tracking-[0.2em] text-ink-soft/80"><Txt k="l:alreadySent">{d.alreadySent}</Txt></p>
              </motion.div>
            ) : !s.rsvp_open ? (
              <motion.p key="closed" className="py-8 text-center font-serif text-xl italic">
                <Txt k="l:rsvpClosed">{d.rsvpClosed}</Txt>
              </motion.p>
            ) : (
              <motion.form key="form" onSubmit={submit} exit={{ opacity: 0, y: -10 }} className="space-y-6" noValidate>
                {/* Guess */}
                <div>
                  <Label><Txt k="l:yourGuess">{d.yourGuess}</Txt></Label>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    {(["boy", "girl"] as const).map((g) => {
                      const active = guess === g;
                      const boy = g === "boy";
                      return (
                        <motion.button
                          key={g}
                          type="button"
                          onClick={() => setGuess(g)}
                          whileTap={{ scale: 0.95 }}
                          animate={active ? { scale: [1, 1.06, 1] } : { scale: 1 }}
                          className={`relative overflow-hidden rounded-[22px] border-2 p-3 pb-4 text-center transition-colors ${
                            active
                              ? boy
                                ? "border-blue-deep bg-blue-soft"
                                : "border-pink-deep bg-pink-soft"
                              : "border-transparent bg-white/80 hover:bg-white"
                          }`}
                          aria-pressed={active}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={imageUrl(s, boy ? "bear_boy" : "bear_girl")}
                            alt=""
                            className={`soft-mask mx-auto h-24 object-contain transition sm:h-28 ${active ? "" : "opacity-80 grayscale-[30%]"}`}
                          />
                          <span className={`font-script block text-4xl ${boy ? "text-blue-deep" : "text-pink-deep"}`}>
                            {boy ? <Txt k="l:boy">{d.boy}</Txt> : <Txt k="l:girl">{d.girl}</Txt>}
                          </span>
                          <AnimatePresence>
                            {active && (
                              <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                                className={`absolute end-3 top-3 flex h-6 w-6 items-center justify-center rounded-full text-white ${
                                  boy ? "bg-blue-deep" : "bg-pink-deep"
                                }`}
                              >
                                <Check size={14} strokeWidth={3} />
                              </motion.span>
                            )}
                          </AnimatePresence>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                <Field label={<Txt k="l:yourName">{d.yourName}</Txt>}>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={80}
                    placeholder={d.namePh}
                    autoComplete="name"
                    className="input"
                    required
                  />
                </Field>

                {s.ask_phone && (
                  <Field label={<Txt k="l:phone">{d.phone}</Txt>}>
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/[^\d+\s-]/g, ""))}
                      maxLength={20}
                      placeholder={d.phonePh}
                      inputMode="tel"
                      autoComplete="tel"
                      className="input"
                      dir="ltr"
                    />
                  </Field>
                )}

                <div>
                  <Label><Txt k="l:willYouAttend">{d.willYouAttend}</Txt></Label>
                  <div className="mt-3 grid grid-cols-2 gap-2 rounded-full bg-cream-2 p-1">
                    {[true, false].map((v) => (
                      <button
                        key={String(v)}
                        type="button"
                        onClick={() => setAttending(v)}
                        className="relative rounded-full px-3 py-3 font-sans text-xs font-semibold uppercase tracking-[0.1em]"
                      >
                        {attending === v && (
                          <motion.span layoutId="attend-pill" className="absolute inset-0 rounded-full bg-white shadow" transition={{ type: "spring", stiffness: 400, damping: 30 }} />
                        )}
                        <span className={`relative ${attending === v ? "text-ink" : "text-ink-soft"}`}>{v ? <Txt k="l:yes">{d.yes}</Txt> : <Txt k="l:no">{d.no}</Txt>}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <AnimatePresence initial={false}>
                  {attending && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <Label><Txt k="l:guestsCount">{d.guestsCount}</Txt></Label>
                      <div className="mt-3 flex items-center justify-center gap-6">
                        <Stepper onClick={() => setGuests((g) => Math.max(1, g - 1))} aria-label="-">
                          <Minus size={18} />
                        </Stepper>
                        <AnimatePresence mode="popLayout">
                          <motion.span
                            key={guests}
                            initial={{ y: -14, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 14, opacity: 0 }}
                            className="font-display w-10 text-center text-4xl"
                          >
                            {guests}
                          </motion.span>
                        </AnimatePresence>
                        <Stepper onClick={() => setGuests((g) => Math.min(10, g + 1))} aria-label="+">
                          <Plus size={18} />
                        </Stepper>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <Field label={<Txt k="l:messageLabel">{d.messageLabel}</Txt>}>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    maxLength={500}
                    rows={3}
                    placeholder={d.messagePh}
                    className="input resize-none"
                  />
                </Field>

                <AnimatePresence>
                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0, x: [0, -6, 6, -4, 4, 0] }}
                      exit={{ opacity: 0 }}
                      className="rounded-2xl bg-pink-soft px-4 py-3 text-center font-sans text-sm text-pink-deep"
                      role="alert"
                    >
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>

                <motion.button
                  type="submit"
                  disabled={busy}
                  whileTap={{ scale: 0.97 }}
                  className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-pink-deep via-[#c49ab4] to-blue-deep px-6 py-4 font-sans text-sm font-semibold uppercase tracking-[0.2em] text-white shadow-[0_18px_40px_-18px_rgba(93,144,211,0.8)] disabled:opacity-70"
                >
                  <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
                  {busy ? <Loader2 className="animate-spin" size={18} /> : <Send size={16} className="rtl:-scale-x-100" />}
                  {busy ? d.sending : <Txt k="l:send">{d.send}</Txt>}
                </motion.button>
              </motion.form>
            )}
          </AnimatePresence>
          <Heart size={80} color="rgba(244,191,204,0.25)" className="pointer-events-none absolute -bottom-6 -start-6" />
        </div>
      </InView>
    </section>
  );
});

export default Rsvp;

function Label({ children }: { children: React.ReactNode }) {
  return <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-soft">{children}</p>;
}

function Field({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="block">
      <Label>{label}</Label>
      <div className="mt-2">{children}</div>
    </label>
  );
}

function Stepper(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className="flex h-11 w-11 items-center justify-center rounded-full border border-ink/15 bg-white text-ink shadow-sm transition active:scale-90"
    />
  );
}
