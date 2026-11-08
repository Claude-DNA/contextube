"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { CloudHighlight } from "@/lib/clouds";

const KIND: Record<string, string> = { characters: "Character", stage: "Place", plot: "Scene" };
const DELAY = 6500;

/**
 * A fanned deck of illustrated cloud elements. The front card shows one element; every few seconds it
 * moves to the back and the next one comes forward. Pauses on hover and focus, and never moves on its
 * own when the reader prefers reduced motion.
 */
export function HeroDeck({ items }: { items: CloudHighlight[] }) {
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [held, setHeld] = useState(false);
  const n = items.length;
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setPlaying(!reduce && n > 1);
  }, [n]);

  useEffect(() => {
    if (!playing || held || n < 2) return;
    const t = setTimeout(() => setI((x) => (x + 1) % n), DELAY);
    return () => clearTimeout(t);
  }, [i, playing, held, n]);

  const go = useCallback((step: number) => setI((x) => (x + step + n) % n), [n]);

  if (!n) return null;
  const cur = items[i];
  const href = `/cloud/${cur.cloud_slug}#e-${cur.id}`;

  return (
    <div
      ref={root}
      className="w-full max-w-[22rem] mx-auto lg:mx-0"
      onMouseEnter={() => setHeld(true)}
      onMouseLeave={() => setHeld(false)}
      onFocus={() => setHeld(true)}
      onBlur={(e) => { if (!root.current?.contains(e.relatedTarget as Node)) setHeld(false); }}
      role="region"
      aria-roledescription="carousel"
      aria-label="Illustrated elements from the clouds"
    >
      <div className="relative aspect-[4/5] [perspective:1200px]">
        {items.map((it, k) => {
          const d = (k - i + n) % n; // 0 = front, 1 and 2 behind, n-1 = the card that just left
          const leaving = n > 3 && d === n - 1;
          const hidden = d > 2 && !leaving;
          const pose = leaving
            ? "translate(-38%, 6%) rotate(-14deg)"
            : d === 0 ? "translate(0,0) rotate(-1.5deg)"
            : d === 1 ? "translate(7%, -3%) rotate(4deg) scale(.96)"
            : "translate(-6%, -5%) rotate(-6deg) scale(.92)";
          return (
            <Link
              key={it.id}
              href={`/cloud/${it.cloud_slug}#e-${it.id}`}
              tabIndex={d === 0 ? 0 : -1}
              aria-hidden={d !== 0}
              className="absolute inset-0 block overflow-hidden rounded-xl bg-[#e9e2d0] shadow-[0_30px_60px_-20px_rgba(0,0,0,.9)] ring-1 ring-white/10 transition-[transform,opacity] duration-700 ease-[cubic-bezier(.2,.7,.2,1)] motion-reduce:transition-none"
              style={{ transform: pose, opacity: hidden || leaving ? 0 : d === 0 ? 1 : 0.85, zIndex: leaving ? 4 : 3 - Math.min(d, 3) }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={it.image.url}
                alt={d === 0 ? it.image.alt : ""}
                title={it.image.credit}
                loading={d <= 2 ? "eager" : "lazy"}
                decoding="async"
                className="h-full w-full object-cover object-[50%_30%]"
              />
              {d !== 0 && <span className="absolute inset-0 bg-black/35" aria-hidden="true" />}
            </Link>
          );
        })}
      </div>

      <div className="mt-8 min-h-[9.5rem]" aria-live={playing && !held ? "off" : "polite"}>
        <p className="text-sm text-gray-500">
          <span className="text-violet-300">{KIND[cur.kind] ?? "Element"}</span> in{" "}
          <Link href={`/cloud/${cur.cloud_slug}`} className="text-gray-300 hover:text-white transition-colors">{cur.cloud_title}</Link>
        </p>
        <h2 className="mt-1 text-xl font-semibold text-white leading-snug">
          <Link href={href} className="hover:text-violet-200 transition-colors">{cur.title}</Link>
        </h2>
        <p className="mt-2 text-[15px] leading-relaxed text-gray-400 line-clamp-3">{cur.text}</p>
      </div>

      <div className="mt-3 flex items-center gap-1 text-gray-400">
        <button type="button" onClick={() => go(-1)} className="rounded-full p-2 hover:bg-gray-900 hover:text-white" aria-label="Previous illustration">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M15 6l-6 6 6 6" /></svg>
        </button>
        <button type="button" onClick={() => setPlaying((p) => !p)} className="rounded-full p-2 hover:bg-gray-900 hover:text-white" aria-label={playing ? "Stop turning the cards" : "Turn the cards automatically"}>
          {playing ? (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" /></svg>
          ) : (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z" /></svg>
          )}
        </button>
        <button type="button" onClick={() => go(1)} className="rounded-full p-2 hover:bg-gray-900 hover:text-white" aria-label="Next illustration">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M9 6l6 6-6 6" /></svg>
        </button>
        <span className="ml-2 text-xs tabular-nums text-gray-600">{i + 1} of {n}</span>
      </div>
    </div>
  );
}
