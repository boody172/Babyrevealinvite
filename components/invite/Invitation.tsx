"use client";

import { AnimatePresence, MotionConfig, motion, useAnimationControls, useScroll, useSpring } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Share2 } from "lucide-react";
import type { Gender, Lang, SectionId, Settings, SiteData, StyleTarget } from "@/lib/types";
import { t, type Dict } from "@/lib/i18n";
import { getInvite, imageUrl } from "@/lib/api";
import { withDefaults } from "@/lib/defaults";
import { sectionVars, themeVars } from "@/lib/theme";
import { LANG_NAMES, localize } from "@/lib/content";
import VideoSection, { parseVideo } from "./VideoSection";
import Intro from "./Intro";
import { Countdown, Details, Footer, HeroCard, MapSection, VoteMeter, Wishes, InView } from "./Sections";
import Rsvp, { burstConfetti } from "./Rsvp";
import { FloatingField, Balloon } from "./Decor";
import Menu, { sectionAnchor } from "./Menu";
import { Globe } from "lucide-react";
import { Txt } from "./Txt";
import { useInlineEdit, EDIT_MESSAGE } from "./useInlineEdit";

export { EDIT_MESSAGE };

const DEVICE_KEY = "baby-reveal-device";
const LANG_KEY = "baby-reveal-lang";
export const PREVIEW_MESSAGE = "baby-reveal:preview";

function getDevice(): string | null {
  try {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id) {
      id = crypto.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(DEVICE_KEY, id);
    }
    return id;
  } catch {
    return `nostore-${Math.random().toString(36).slice(2)}-${Date.now()}`;
  }
}

function RevealHero({ data, gender, d }: { data: SiteData; gender: Gender; d: Dict }) {
  const boy = gender === "boy";
  const v = data.votes;
  const total = v ? v.boy + v.girl : 0;
  return (
    <section className={`relative overflow-hidden px-5 pb-16 pt-20 text-center ${boy ? "bg-blue-soft" : "bg-pink-soft"}`}>
      <FloatingField level={data.settings.theme.decor} />
      <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative mb-4 font-sans text-xs uppercase tracking-[0.4em] text-ink-soft">
        <Txt k="c:baby_name">{data.settings.baby_name}</Txt>
      </motion.p>
      <motion.h1
        initial={{ scale: 0.3, opacity: 0, rotate: -8 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 90, damping: 10, delay: 0.2 }}
        className={`relative font-script text-7xl leading-[1.15] sm:text-9xl ${boy ? "text-blue-deep" : "text-pink-deep"}`}
      >
        <Txt k="l:itsA">{d.itsA}</Txt> {boy ? d.boy : d.girl}!
      </motion.h1>
      <motion.div
        className="soft-mask relative mx-auto mt-6 w-48 sm:w-60"
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: [0, -12, 0], opacity: 1 }}
        transition={{ y: { duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }, opacity: { delay: 0.6 } }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl(data.settings, boy ? "bear_boy" : "bear_girl")} alt="" className="w-full" />
      </motion.div>
      {total > 0 && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }} className="relative mt-6 font-serif text-2xl italic">
          {v![gender]} / {total} <Txt k="l:guessedRight">{d.guessedRight}</Txt>
        </motion.p>
      )}
    </section>
  );
}

/** Thin bar at the top that fills as the guest scrolls through the invitation. */
function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.4 });
  return (
    <motion.div
      aria-hidden
      className="fixed inset-x-0 top-0 z-[56] h-1 bg-gradient-to-r from-blue-deep via-gold to-pink-deep"
      style={{ scaleX, transformOrigin: "var(--origin)" }}
    />
  );
}

export default function Invitation({ slug, initial, preview = false }: { slug: string; initial: SiteData | null; preview?: boolean }) {
  const [data, setData] = useState<SiteData | null>(initial);
  const [opened, setOpened] = useState(false);
  const [device, setDevice] = useState<string | null>(null);
  const [guess, setGuess] = useState<Gender | null>(null);
  const [failed, setFailed] = useState(false);
  const [chosenLang, setChosenLang] = useState<Lang | null>(null); // guest's pick from the language switch
  const [editMode, setEditMode] = useState(false); // dashboard preview: click any text to change it
  const rsvpRef = useRef<HTMLElement>(null);
  const draft = useRef<Settings | null>(null);

  const load = useCallback(async (dev: string | null) => {
    try {
      const fresh = await getInvite(slug, dev);
      if (!fresh) return setFailed(true);
      // in dashboard preview, unsaved design edits win over the stored settings
      setData(draft.current ? { ...fresh, settings: draft.current } : fresh);
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, [slug]);

  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get("lang");
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(LANG_KEY);
    } catch {}
    const pick = fromUrl ?? saved;
    if (pick === "ar" || pick === "en") setChosenLang(pick);
  }, []);

  useEffect(() => {
    const dev = preview ? null : getDevice();
    setDevice(dev);
    load(dev);
    const id = setInterval(() => load(dev), 30000);
    return () => clearInterval(id);
  }, [load, preview]);

  // Live preview: the dashboard posts its unsaved settings into this iframe.
  useEffect(() => {
    if (!preview) return;
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.data?.type !== PREVIEW_MESSAGE) return;
      draft.current = withDefaults(e.data.settings);
      if (e.data.lang === "ar" || e.data.lang === "en") setChosenLang(e.data.lang);
      setEditMode(!!e.data.edit);
      setData((prev) => (prev ? { ...prev, settings: draft.current! } : prev));
    };
    window.addEventListener("message", onMessage);
    window.parent?.postMessage({ type: `${PREVIEW_MESSAGE}:ready` }, window.location.origin);
    return () => window.removeEventListener("message", onMessage);
  }, [preview]);

  const base = data?.settings;
  const lang: Lang = base ? (chosenLang && base.languages.includes(chosenLang) ? chosenLang : base.language) : "en";
  const s = base ? localize(base, lang) : undefined;
  const view = data && s ? { ...data, settings: s } : null; // what the guest sees, in their language
  const d = t(lang, s?.labels?.[lang]);

  function switchLanguage() {
    if (!base) return;
    const next = base.languages[(base.languages.indexOf(lang) + 1) % base.languages.length];
    setChosenLang(next);
    try {
      localStorage.setItem(LANG_KEY, next);
    } catch {}
  }
  const skipIntro = preview || s?.theme.intro === false;

  // switching language: a soft fade/blur instead of an abrupt text swap (content stays mounted)
  const langFade = useAnimationControls();
  const prevLang = useRef(lang);
  useEffect(() => {
    if (prevLang.current === lang) return;
    prevLang.current = lang;
    langFade.start({ opacity: [0.25, 1], filter: ["blur(4px)", "blur(0px)"], transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] }, transitionEnd: { filter: "none" } });
  }, [lang, langFade]);
  useInlineEdit(preview && editMode, lang);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  useEffect(() => {
    document.body.style.overflow = opened || skipIntro ? "" : "hidden";
  }, [opened, skipIntro]);

  function handleOpen() {
    setOpened(true);
    window.scrollTo({ top: 0 });
    setTimeout(() => burstConfetti(data?.revealed ? data.gender : undefined), 350);
  }

  function pick(g: Gender) {
    setGuess(g);
    rsvpRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function share() {
    const url = window.location.origin + window.location.pathname;
    try {
      if (navigator.share) await navigator.share({ title: `${s?.title ?? ""} — ${d.boyOrGirl}`, url });
      else await navigator.clipboard.writeText(url);
    } catch {}
  }

  if (!data || !s || !view || !base) {
    return (
      <main className="watercolor-bg flex min-h-[100svh] flex-col items-center justify-center gap-4 px-6 text-center">
        <motion.div animate={{ y: [0, -14, 0] }} transition={{ duration: 2, repeat: Infinity }} className="flex gap-2">
          <Balloon color="pink" size={36} />
          <Balloon color="blue" size={36} />
        </motion.div>
        {failed && (
          <button onClick={() => load(device)} className="font-sans text-sm text-ink-soft underline">
            Retry · إعادة المحاولة
          </button>
        )}
      </main>
    );
  }

  const revealed = data.revealed && data.gender ? data.gender : null;
  const showContent = opened || skipIntro;

  // per-section design overrides from the dashboard
  const styled = (id: StyleTarget) => {
    const st = s.section_styles?.[id];
    return { style: sectionVars(st), "data-align": st?.align || undefined };
  };

  const render: Record<SectionId, () => React.ReactNode> = {
    countdown: () => !revealed && <Countdown s={s} d={d} />,
    details: () => <Details s={s} d={d} mapButton={!s.sections.some((x) => x.id === "map" && x.visible)} />,
    map: () => <MapSection s={s} d={d} />,
    video: () => <VideoSection s={s} d={d} />,
    vote: () => <VoteMeter data={view} d={d} onPick={revealed ? () => {} : pick} />,
    rsvp: () =>
      !revealed && (
        <Rsvp
          ref={rsvpRef}
          data={view}
          d={d}
          device={device}
          slug={slug}
          preview={preview}
          guess={guess}
          setGuess={setGuess}
          onDone={(m) => {
            setData((prev) => (prev ? { ...prev, mine: m } : prev));
            if (!preview) setTimeout(() => load(device), 800);
          }}
        />
      ),
    wishes: () => data.wishes && <Wishes wishes={data.wishes} d={d} />,
  };

  // sections that actually render (hidden ones, and those that vanish after the reveal, get no menu entry)
  const shown = s.sections
    .filter((x) => x.visible)
    .map((x) => x.id)
    .filter((id) => !(revealed && (id === "countdown" || id === "rsvp")))
    .filter((id) => !(id === "wishes" && !data.wishes?.length) && !(id === "video" && !parseVideo(s.video.url)));

  return (
    <MotionConfig reducedMotion="user">
      <main
        className="watercolor-bg paper-noise relative min-h-screen"
        dir={lang === "ar" ? "rtl" : "ltr"}
        style={{ ...themeVars(s.theme), ["--origin" as string]: lang === "ar" ? "right" : "left" }}
      >
        <AnimatePresence>
          {!showContent && (
            <Intro key="intro" d={d} onOpen={handleOpen} reveal={revealed ?? undefined} babyName={s.baby_name} decor={s.theme.decor} />
          )}
        </AnimatePresence>

        <FloatingField level={s.theme.decor} />
        {base.languages.length > 1 && (
          <motion.button
            type="button"
            onClick={switchLanguage}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            whileTap={{ scale: 0.92 }}
            aria-label={d.language}
            className="glass fixed top-4 z-[55] flex h-12 items-center gap-1.5 rounded-full px-4 font-sans text-sm font-semibold text-ink"
            style={{ insetInlineEnd: 16 }}
          >
            <Globe size={16} />
            {LANG_NAMES[base.languages[(base.languages.indexOf(lang) + 1) % base.languages.length]]}
          </motion.button>
        )}
        {showContent && <Menu s={s} d={d} sections={shown} />}
        {showContent && <ScrollProgress />}

        {showContent && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }} className="relative">
            <motion.div animate={langFade}>
              <div id={sectionAnchor("top")} {...styled("hero")}>
                {revealed && <RevealHero data={view} gender={revealed} d={d} />}
                <HeroCard s={s} d={d} />
              </div>
              {shown.map((id) => (
                <div key={id} id={sectionAnchor(id)} className="scroll-mt-4" {...styled(id)}>
                  {render[id]()}
                </div>
              ))}
              <InView className="flex justify-center pb-4 pt-6">
                <button
                  onClick={share}
                  className="flex items-center gap-2 rounded-full bg-white/80 px-5 py-2.5 font-sans text-xs font-medium uppercase tracking-[0.2em] text-ink-soft shadow-sm transition hover:bg-white active:scale-95"
                >
                  <Share2 size={14} /> <Txt k="l:share">{d.share}</Txt>
                </button>
              </InView>
              <div {...styled("footer")}>
                <Footer s={s} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </main>
    </MotionConfig>
  );
}
