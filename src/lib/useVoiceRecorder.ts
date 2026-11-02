"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Records a voice message of at most 60 seconds in the browser.
 *  - The recording is an .m4a (AAC) where the browser can make one (every phone and Safari plays it), else WebM / Ogg Opus.
 *  - On desktop Chrome / Edge the browser's speech recognition writes what is said while recording (the result goes with the message as its
 *    text). Phones skip it, because recognising and recording at once makes Android record silence; the server writes the text there
 *    when voice-to-text is switched on (CRM > Settings > Voice to text).
 */
export const MAX_VOICE_SECONDS = 60;

export interface VoiceResult { blob: Blob; seconds: number; transcript: string; mime: string; /** loudness along the recording: 40 numbers, 0-100 (the bars of the voice message) */ waveform: number[] }
export const WAVE_BARS = 40;

/** any number of loudness samples -> WAVE_BARS bars: the loudest part is full height, quiet parts stay visible */
export function toBars(samples: number[], bars = WAVE_BARS): number[] {
  if (!samples.length) return [];
  const out: number[] = [];
  for (let i = 0; i < bars; i++) {
    const a = Math.floor((i * samples.length) / bars), b = Math.max(a + 1, Math.floor(((i + 1) * samples.length) / bars));
    let peak = 0;
    for (let k = a; k < b && k < samples.length; k++) peak = Math.max(peak, samples[k]);
    out.push(peak);
  }
  const max = Math.max(...out, 0.0001);
  return out.map((v) => Math.max(8, Math.round(Math.pow(v / max, 0.7) * 100)));
}

const peaksCache = new Map<string, number[]>();
/** bars for a recording that has none stored (made before they existed): decoded in the browser once */
export async function peaksFromUrl(url: string): Promise<number[]> {
  const hit = peaksCache.get(url);
  if (hit) return hit;
  try {
    const buf = await (await fetch(url)).arrayBuffer();
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const audio = await ctx.decodeAudioData(buf);
    void ctx.close();
    const data = audio.getChannelData(0), step = Math.max(1, Math.floor(data.length / 400)), rms: number[] = [];
    for (let i = 0; i < data.length; i += step) { let sum = 0, n = 0; for (let k = i; k < Math.min(data.length, i + step); k += 8) { sum += data[k] * data[k]; n++; } rms.push(Math.sqrt(sum / Math.max(1, n))); }
    const bars = toBars(rms);
    peaksCache.set(url, bars);
    return bars;
  } catch { return []; }
}
type Recognition = { start: () => void; stop: () => void; abort: () => void; lang: string; continuous: boolean; interimResults: boolean; onresult: ((e: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null; onend: (() => void) | null; onerror: (() => void) | null };

const MIMES = ["audio/mp4;codecs=mp4a.40.2", "audio/mp4", "audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus"];
const LANG: Record<string, string> = { en: "en-IN", bn: "bn-IN", hi: "hi-IN" };

export function voiceSupported() {
  return typeof window !== "undefined" && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== "undefined";
}

export function useVoiceRecorder(language = "en", onLimit?: (r: VoiceResult) => void) {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  /** the last moments of the voice, for the moving bars while recording */
  const [live, setLive] = useState<number[]>([]);
  const samples = useRef<number[]>([]);
  const audioCtx = useRef<AudioContext | null>(null);
  const meter = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const [error, setError] = useState("");
  const rec = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const chunks = useRef<Blob[]>([]);
  const started = useRef(0);
  const timer = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const recog = useRef<Recognition | null>(null);
  const said = useRef("");
  const settle = useRef<((r: VoiceResult | null) => void) | null>(null);
  const keep = useRef(true);
  const limit = useRef(onLimit);
  limit.current = onLimit;

  const cleanup = useCallback(() => {
    clearInterval(timer.current);
    clearInterval(meter.current);
    void audioCtx.current?.close().catch(() => undefined);
    audioCtx.current = null;
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    try { recog.current?.abort(); } catch { /* not running */ }
    recog.current = null;
    setRecording(false);
  }, []);
  useEffect(() => () => { keep.current = false; try { rec.current?.state === "recording" && rec.current.stop(); } catch { /* gone */ } cleanup(); }, [cleanup]);

  const finish = useCallback((toCaller: boolean) => {
    const r = rec.current;
    if (!r || r.state === "inactive") return;
    keep.current = toCaller;
    r.stop();
  }, []);

  const start = useCallback(async (): Promise<boolean> => {
    setError("");
    if (!voiceSupported()) { setError("Voice messages are not supported in this browser."); return false; }
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      stream.current = s;
      const mime = MIMES.find((m) => MediaRecorder.isTypeSupported(m));
      const r = new MediaRecorder(s, mime ? { mimeType: mime } : undefined);
      chunks.current = []; said.current = ""; keep.current = true; samples.current = []; setLive([]);
      // how loud it is, 12 times a second: the bars of the message (and the moving bars while recording)
      try {
        const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new Ctx(), an = ctx.createAnalyser();
        an.fftSize = 512;
        ctx.createMediaStreamSource(s).connect(an);
        audioCtx.current = ctx;
        const buf = new Uint8Array(an.fftSize);
        meter.current = setInterval(() => {
          an.getByteTimeDomainData(buf);
          let sum = 0;
          for (let i = 0; i < buf.length; i++) { const x = (buf[i] - 128) / 128; sum += x * x; }
          const level = Math.sqrt(sum / buf.length);
          samples.current.push(level);
          setLive((cur) => [...cur.slice(-35), level]);
        }, 80);
      } catch { /* no meter: the message simply has no bars until they are read from the file */ }
      r.ondataavailable = (e) => { if (e.data.size) chunks.current.push(e.data); };
      r.onstop = () => {
        const secs = Math.min(MAX_VOICE_SECONDS, Math.max(1, Math.round((Date.now() - started.current) / 1000)));
        const type = (r.mimeType || mime || "audio/webm").split(";")[0];
        const blob = new Blob(chunks.current, { type });
        cleanup();
        const result = keep.current && blob.size > 0 ? { blob, seconds: secs, transcript: said.current.replace(/\s+/g, " ").trim(), mime: type, waveform: toBars(samples.current) } : null;
        if (settle.current) { settle.current(result); settle.current = null; } else if (result) limit.current?.(result);
      };
      rec.current = r;
      started.current = Date.now();
      r.start(250);
      setSeconds(0); setRecording(true);
      timer.current = setInterval(() => {
        const secs = Math.floor((Date.now() - started.current) / 1000);
        setSeconds(secs);
        if (secs >= MAX_VOICE_SECONDS) finish(true); // one minute is the limit: it stops and is handed over
      }, 200);
      // text from the browser's own speech recognition: desktop only (see above)
      const SR = (window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition }).SpeechRecognition ?? (window as unknown as { webkitSpeechRecognition?: new () => Recognition }).webkitSpeechRecognition;
      if (SR && !/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)) {
        const sr = new SR();
        sr.lang = LANG[language] ?? "en-IN"; sr.continuous = true; sr.interimResults = false;
        sr.onresult = (e) => { for (let i = e.resultIndex; i < e.results.length; i++) if (e.results[i].isFinal) said.current += ` ${e.results[i][0].transcript}`; };
        sr.onend = () => { if (rec.current?.state === "recording") { try { sr.start(); } catch { /* already running */ } } };
        sr.onerror = () => undefined;
        recog.current = sr;
        try { sr.start(); } catch { /* recognition unavailable */ }
      }
      return true;
    } catch {
      cleanup();
      setError("We could not use the microphone. Allow microphone access for this site and try again.");
      return false;
    }
  }, [cleanup, finish, language]);

  /** stops and gives the recording back (null when it was empty) */
  const stop = useCallback((): Promise<VoiceResult | null> => new Promise((resolve) => {
    if (!rec.current || rec.current.state === "inactive") { resolve(null); return; }
    settle.current = resolve;
    // the speech recognition needs a moment to deliver its last words
    setTimeout(() => finish(true), recog.current ? 600 : 0);
  }), [finish]);

  const cancel = useCallback(() => { settle.current = null; finish(false); cleanup(); }, [cleanup, finish]);

  return { recording, seconds, live, error, start, stop, cancel, supported: voiceSupported() };
}

/** uploads a picture or a recording of the chat; returns the address to put on the message */
export async function uploadChatMedia(kind: "image" | "voice", blob: Blob, endpoint = "/api/chat-upload"): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  try {
    const res = await fetch(`${endpoint}?kind=${kind}`, { method: "POST", headers: { "content-type": (blob.type || (kind === "image" ? "image/jpeg" : "audio/mp4")).split(";")[0] }, body: blob });
    const json = (await res.json().catch(() => null)) as { status?: string; message?: string; data?: { url: string } } | null;
    if (!res.ok || json?.status !== "success" || !json.data) return { ok: false, error: json?.message ?? "The upload failed. Please try again." };
    return { ok: true, url: json.data.url };
  } catch {
    return { ok: false, error: "No connection. Please try again." };
  }
}
