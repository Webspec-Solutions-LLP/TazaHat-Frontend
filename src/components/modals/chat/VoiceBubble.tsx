"use client";

import { useEffect, useRef, useState } from "react";
import { peaksFromUrl } from "@/lib/useVoiceRecorder";

let playing: HTMLAudioElement | null = null; // one recording plays at a time
const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

/**
 * A voice message like WhatsApp's: the written text (when there is some) on top; below it play / pause and the sound's bars - tall where the
 * voice is loud, short where it is quiet - that fill in as it plays; tap or drag the bars to jump. The bars are stored with the message;
 * an older recording without them is read once in the browser.
 */
export default function VoiceBubble({ src, seconds, transcript, waveform }: { src: string; seconds: number; transcript?: string | null; waveform?: number[] }) {
  const audio = useRef<HTMLAudioElement | null>(null);
  const [on, setOn] = useState(false);
  const [now, setNow] = useState(0);
  const [length, setLength] = useState(seconds);
  const [failed, setFailed] = useState(false);
  const [bars, setBars] = useState<number[]>(waveform ?? []);

  useEffect(() => { if (waveform?.length) { setBars(waveform); return; } let live = true; void peaksFromUrl(src).then((p) => live && p.length && setBars(p)); return () => { live = false; }; }, [waveform, src]);
  useEffect(() => () => { if (audio.current && playing === audio.current) playing = null; audio.current?.pause(); }, []);

  const toggle = () => {
    const a = audio.current;
    if (!a) return;
    if (a.paused) { if (playing && playing !== a) playing.pause(); playing = a; void a.play().catch(() => setFailed(true)); } else a.pause();
  };
  const seek = (clientX: number, el: HTMLElement) => {
    const a = audio.current;
    if (!a || !length) return;
    const r = el.getBoundingClientRect();
    a.currentTime = Math.max(0, Math.min(1, (clientX - r.left) / r.width)) * length;
    setNow(a.currentTime);
  };
  const shown = bars.length ? bars : Array.from({ length: 40 }, () => 14);
  const progress = length ? Math.min(1, now / length) : 0;

  return (
    <div className="chat-voice">
      {transcript && <p className="chat-voice-text">{transcript}</p>}
      <div className="chat-voice-player">
        <button type="button" className="chat-voice-play" onClick={toggle} aria-label={on ? "Pause voice message" : "Play voice message"} disabled={failed}>
          {on ? <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" /></svg> : <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>}
        </button>
        <div className="chat-wave" role="slider" aria-label="Seek" aria-valuemin={0} aria-valuemax={Math.round(length)} aria-valuenow={Math.round(now)} tabIndex={0}
          onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); seek(e.clientX, e.currentTarget); }}
          onPointerMove={(e) => { if (e.buttons) seek(e.clientX, e.currentTarget); }}>
          {shown.map((h, i) => <i key={i} className={(i + 0.5) / shown.length <= progress ? "is-played" : ""} style={{ height: `${Math.max(12, h)}%` }} />)}
        </div>
        <span className="chat-voice-time">{failed ? "Cannot play" : clock(on || now > 0 ? now : length)}</span>
        <audio ref={audio} src={src} preload="metadata" onPlay={() => setOn(true)} onPause={() => setOn(false)} onEnded={() => { setOn(false); setNow(0); }} onTimeUpdate={(e) => setNow(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => { const d = e.currentTarget.duration; if (Number.isFinite(d) && d > 0) setLength(d); }} onError={() => setFailed(true)} />
      </div>
    </div>
  );
}
