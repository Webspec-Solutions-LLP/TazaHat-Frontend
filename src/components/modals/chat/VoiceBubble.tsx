"use client";

import { useEffect, useRef, useState } from "react";

let playing: HTMLAudioElement | null = null; // one recording plays at a time

const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

/** A voice message: the written text (when there is some) on top, the recording below it with play / pause, a seek bar and the time. */
export default function VoiceBubble({ src, seconds, transcript }: { src: string; seconds: number; transcript?: string | null }) {
  const audio = useRef<HTMLAudioElement | null>(null);
  const [on, setOn] = useState(false);
  const [now, setNow] = useState(0);
  const [length, setLength] = useState(seconds);
  const [failed, setFailed] = useState(false);

  useEffect(() => () => { if (audio.current && playing === audio.current) playing = null; audio.current?.pause(); }, []);

  const toggle = () => {
    const a = audio.current;
    if (!a) return;
    if (a.paused) {
      if (playing && playing !== a) playing.pause();
      playing = a;
      void a.play().catch(() => setFailed(true));
    } else a.pause();
  };

  return (
    <div className="chat-voice">
      {transcript && <p className="chat-voice-text">{transcript}</p>}
      <div className="chat-voice-player">
        <button type="button" className="chat-voice-play" onClick={toggle} aria-label={on ? "Pause voice message" : "Play voice message"} disabled={failed}>
          {on ? <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" /></svg> : <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>}
        </button>
        <input className="chat-voice-seek" type="range" min={0} max={Math.max(1, length)} step={0.1} value={Math.min(now, length)} aria-label="Seek" disabled={failed}
          onChange={(e) => { const a = audio.current; if (a) { a.currentTime = Number(e.target.value); setNow(a.currentTime); } }} />
        <span className="chat-voice-time">{failed ? "Cannot play" : clock(on || now > 0 ? now : length)}</span>
        <audio ref={audio} src={src} preload="metadata"
          onPlay={() => setOn(true)} onPause={() => setOn(false)} onEnded={() => { setOn(false); setNow(0); }}
          onTimeUpdate={(e) => setNow(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => { const d = e.currentTarget.duration; if (Number.isFinite(d) && d > 0) setLength(d); }}
          onError={() => setFailed(true)} />
      </div>
    </div>
  );
}
