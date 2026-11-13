"use client";

import { type RefObject, useEffect, useState } from "react";

const TYPE_MS = 70;
const DELETE_MS = 32;
const HOLD_MS = 1700;
const GAP_MS = 350;

/**
 * Types product names, one letter at a time, into an input's placeholder ("Search for Rohu Fish|"), holds each for a moment, deletes it and
 * goes on to the next. The text is written straight to the input (no React state), so the busy header does not re-render for every letter.
 * Desktop view only (the header's compact search of phones and tablets, up to 876 px wide, keeps the plain placeholder). It rests on the normal
 * placeholder while the visitor is typing / the input has focus, while the tab is hidden, and for visitors who ask for less motion.
 */
const DESKTOP = "(min-width: 877px)"; // the header turns into the compact search at 876 px (Navbar.css)

export function useTypingPlaceholder(input: RefObject<HTMLInputElement | null>, names: string[], prefix: string, fallback: string) {
  const [desktop, setDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(DESKTOP);
    const sync = () => setDesktop(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const el = input.current;
    if (!el) return;
    el.placeholder = fallback;
    if (!desktop || names.length === 0 || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    let timer: number | undefined;
    let n = 0;
    let len = 0;
    let phase: "type" | "hold" | "delete" = "type";
    let stopped = false;

    const resting = () => document.hidden || document.activeElement === el || el.value !== "";
    const schedule = (ms: number) => { timer = window.setTimeout(tick, ms); };
    const tick = () => {
      if (stopped) return;
      if (resting()) { if (el.placeholder !== fallback) el.placeholder = fallback; len = 0; phase = "type"; schedule(600); return; }
      const name = names[n % names.length];
      if (phase === "type") {
        len += 1;
        el.placeholder = `${prefix}${name.slice(0, len)}|`;
        if (len >= name.length) { phase = "hold"; el.placeholder = `${prefix}${name}`; schedule(HOLD_MS); } else schedule(TYPE_MS);
      } else if (phase === "hold") {
        phase = "delete"; schedule(DELETE_MS);
      } else {
        len -= 1;
        el.placeholder = len > 0 ? `${prefix}${name.slice(0, len)}|` : prefix.trimEnd();
        if (len <= 0) { phase = "type"; n += 1; schedule(GAP_MS); } else schedule(DELETE_MS);
      }
    };
    schedule(800);
    return () => { stopped = true; if (timer) window.clearTimeout(timer); if (el) el.placeholder = fallback; };
  }, [input, desktop, names, prefix, fallback]);
}
