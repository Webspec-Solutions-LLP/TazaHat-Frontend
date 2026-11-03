"use client";

import { useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type SyntheticEvent } from "react";

/**
 * Zoom for a product picture (product page and the quick view).
 * Mouse on a wide screen: a lens follows the pointer over the picture and a larger preview opens beside it (Amazon / Flipkart style).
 * Touch or narrow screens: tap the picture to zoom in at that spot, tap again to zoom out.
 *
 * `galleryRef` goes on the element that holds the picture (the preview is positioned inside it); `containerProps` on the box that
 * shows the picture, `imageProps` on the <Image> in it. `hasThumbs`: the thumbnail strip takes 88 px on the left of the picture.
 */
const ZOOM = 2.6;
const THUMB_STRIP = 88;

interface Box { left: number; top: number; width: number; height: number }
export interface ZoomLens { lens: Box; pane: Box; img: Box }

export function useImageZoom<T extends HTMLElement>(hasThumbs: boolean) {
  const galleryRef = useRef<T>(null);
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  // the picture that is really on screen (the logo when the product's own file is missing), so the preview shows the same one
  const [shownSrc, setShownSrc] = useState<string | null>(null);
  const [tapZoom, setTapZoom] = useState<{ x: number; y: number } | null>(null);
  const [lens, setLens] = useState<ZoomLens | null>(null);

  const spot = (e: ReactPointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return { r, cx: e.clientX - r.left, cy: e.clientY - r.top };
  };

  const moveLens = (e: ReactPointerEvent<HTMLDivElement>) => {
    const gallery = galleryRef.current;
    if (e.pointerType === "touch" || !gallery || !natural || window.innerWidth < 877) return;
    const { r, cx, cy } = spot(e);
    // where the picture really sits inside the box: shown "contain", 12px padding, and room for the thumbnail strip on the left
    const padL = hasThumbs ? THUMB_STRIP : 12;
    const availW = r.width - padL - 12, availH = r.height - 24;
    const scale = Math.min(availW / natural.w, availH / natural.h);
    const dw = natural.w * scale, dh = natural.h * scale;
    const ox = padL + (availW - dw) / 2, oy = 12 + (availH - dh) / 2;
    if (cx < ox || cx > ox + dw || cy < oy || cy > oy + dh) return setLens(null);
    const g = gallery.getBoundingClientRect();
    // The preview is a popup beside the picture: a little taller (above and below it) and wider than the picture, kept inside the window
    const paneH = Math.min(r.height + 96, window.innerHeight - 110);
    const paneW = Math.min(r.width * 1.3, window.innerWidth - r.right - 36);
    const paneTopInWindow = Math.max(88, Math.min(r.top - (paneH - r.height) / 2, window.innerHeight - paneH - 14));
    const pane = { left: r.right - g.left + 16, top: paneTopInWindow - g.top, width: paneW, height: paneH };
    if (pane.width < 260) return setLens(null);
    const lw = pane.width / ZOOM, lh = pane.height / ZOOM;
    const lx = Math.min(Math.max(cx - lw / 2, ox), ox + dw - lw), ly = Math.min(Math.max(cy - lh / 2, oy), oy + dh - lh);
    const iw = dw * ZOOM, ih = dh * ZOOM;
    setLens({
      lens: { left: lx, top: ly, width: lw, height: lh },
      pane,
      img: { width: iw, height: ih, left: -((lx - ox) / dw) * iw, top: -((ly - oy) / dh) * ih },
    });
  };

  const containerProps = {
    onPointerMove: moveLens,
    onPointerDown: (e: ReactPointerEvent<HTMLDivElement>) => {
      pointerStart.current = { x: e.clientX, y: e.clientY };
    },
    onPointerLeave: (e: ReactPointerEvent<HTMLDivElement>) => { if (e.pointerType !== "touch") setLens(null); },
    onPointerUp: (e: ReactPointerEvent<HTMLDivElement>) => {
      if (e.pointerType === "touch" || window.innerWidth < 877) {
        const start = pointerStart.current;
        pointerStart.current = null;
        if (start && Math.hypot(e.clientX - start.x, e.clientY - start.y) > 10) return;
        if (e.target instanceof Element && e.target.closest("button")) return;
        const { r, cx, cy } = spot(e);
        setTapZoom((current) => (current ? null : { x: (cx / r.width) * 100, y: (cy / r.height) * 100 }));
      }
    },
  };

  const imageProps: { onLoad: (e: SyntheticEvent<HTMLImageElement>) => void; style?: CSSProperties } = {
    onLoad: (e) => {
      setNatural({ w: e.currentTarget.naturalWidth || 1, h: e.currentTarget.naturalHeight || 1 });
      setShownSrc(e.currentTarget.currentSrc || null);
    },
    style: tapZoom ? { transform: "scale(2.2)", transformOrigin: `${tapZoom.x}% ${tapZoom.y}%` } : undefined,
  };

  /** another picture was chosen: close the lens and the tap zoom */
  const reset = () => { setLens(null); setTapZoom(null); };

  return { galleryRef, lens, tapZoom, shownSrc, containerProps, imageProps, reset };
}
