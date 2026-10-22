"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Play } from "lucide-react";
import type { Dict } from "@/lib/i18n";
import type { Settings } from "@/lib/types";
import { mediaUrl } from "@/lib/api";
import { InView, SectionTitle } from "./Sections";

type Embed = { kind: "youtube" | "vimeo"; id: string } | { kind: "file"; url: string };

export function parseVideo(url: string): Embed | null {
  const u = url.trim();
  if (!u) return null;
  const yt = u.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})/);
  if (yt) return { kind: "youtube", id: yt[1] };
  const vm = u.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vm) return { kind: "vimeo", id: vm[1] };
  return /^https:\/\//.test(u) ? { kind: "file", url: u } : null;
}

function PlayButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="absolute inset-0 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.span
        className="flex h-20 w-20 items-center justify-center rounded-full bg-white/85 text-ink shadow-xl backdrop-blur"
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 1.8, repeat: Infinity }}
        whileTap={{ scale: 0.9 }}
      >
        <Play size={30} className="ms-1 fill-current" />
      </motion.span>
    </motion.button>
  );
}

/** Uploaded video: fetched only near the viewport, inline on phones, optional muted autoplay. */
function FilePlayer({ src, poster, autoplay, label }: { src: string; poster?: string; autoplay: boolean; label: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [near, setNear] = useState(false);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setNear(true);
        if (!autoplay) return;
        if (entry.intersectionRatio > 0.6) el.play().catch(() => {});
        else if (!el.paused) el.pause();
      },
      { rootMargin: "300px 0px", threshold: [0, 0.6] },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [autoplay]);

  return (
    <div className="relative aspect-video overflow-hidden rounded-[22px] bg-ink">
      <video
        ref={ref}
        src={near ? src : undefined}
        poster={poster}
        preload={near ? "metadata" : "none"}
        playsInline
        muted={autoplay && !playing}
        controls={playing}
        onPlay={() => setPlaying(true)}
        className="h-full w-full object-cover"
      />
      <AnimatePresence>
        {!playing && (
          <PlayButton
            label={label}
            onClick={() => {
              const el = ref.current;
              if (!el) return;
              if (!el.src) el.src = src;
              el.muted = false;
              el.play().catch(() => {});
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/** YouTube / Vimeo: show a thumbnail and load the heavy player only after a tap. */
function EmbedPlayer({ embed, poster, label }: { embed: Extract<Embed, { kind: "youtube" | "vimeo" }>; poster?: string; label: string }) {
  const [active, setActive] = useState(false);
  const thumb = poster ?? (embed.kind === "youtube" ? `https://i.ytimg.com/vi/${embed.id}/hqdefault.jpg` : undefined);
  const src =
    embed.kind === "youtube"
      ? `https://www.youtube-nocookie.com/embed/${embed.id}?autoplay=1&playsinline=1&rel=0`
      : `https://player.vimeo.com/video/${embed.id}?autoplay=1&playsinline=1`;
  return (
    <div className="relative aspect-video overflow-hidden rounded-[22px] bg-ink">
      {active ? (
        <iframe src={src} title={label} className="absolute inset-0 h-full w-full border-0" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen />
      ) : (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {thumb && <img src={thumb} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />}
          <PlayButton label={label} onClick={() => setActive(true)} />
        </>
      )}
    </div>
  );
}

export default function VideoSection({ s, d }: { s: Settings; d: Dict }) {
  const embed = parseVideo(s.video.url);
  if (!embed) return null;
  const poster = s.video.poster ? mediaUrl(s.video.poster) : undefined;
  return (
    <section className="relative px-5 py-16">
      <SectionTitle script={s.video_title || d.navVideo} />
      <InView className="mx-auto max-w-3xl">
        <div className="glass rounded-[28px] p-2">
          {embed.kind === "file" ? (
            <FilePlayer src={embed.url} poster={poster} autoplay={s.video.autoplay} label={d.playVideo} />
          ) : (
            <EmbedPlayer embed={embed} poster={poster} label={d.playVideo} />
          )}
        </div>
      </InView>
    </section>
  );
}
