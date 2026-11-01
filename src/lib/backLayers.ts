"use client";

import { useEffect, useRef } from "react";

/**
 * The Back button (browser, phone or an installed app) closes what is open on top before it leaves the page.
 *
 * Every popup / side panel that is open is a "layer". Opening one adds an entry to the browser history, so Back has something to take
 * away: the top layer closes (with its own closing animation). When no layer is open Back works as before: on the home page the
 * "Leaving TazaHat so soon?" question (HomeBackConfirmation), elsewhere the previous page.
 * A layer that is closed another way (X, Esc, outside click) takes its history entry away again, so Back never needs a second press.
 *
 * Next.js listens to the same history events and would treat them as page navigations (it even reloads the whole page for an entry it
 * did not create). The Back events that belong to a layer are therefore handled here first and kept from Next.js: closing a popup
 * never refreshes the page or calls the server.
 */
interface Layer { id: number; close: () => void; pushed: boolean; popped: boolean; disposed: boolean }

const stack: Layer[] = [];
const waiting: (() => void)[] = [];
const fallbacks = new Set<() => void>();
let skip = 0; // history.back() calls we made ourselves whose popstate must be ignored
let nextId = 1;
let listening = false;

const stateOf = () => (window.history.state ?? {}) as { tazahatLayer?: number };
const flush = () => { for (const fn of waiting.splice(0)) fn(); };

function onPopState(event: PopStateEvent) {
  if (skip > 0) {
    event.stopImmediatePropagation();
    skip -= 1;
    if (skip === 0) flush();
    return;
  }
  // the entry that was left belonged to the topmost layer that has one: close that layer
  for (let i = stack.length - 1; i >= 0; i--) {
    if (!stack[i].pushed) continue;
    const [layer] = stack.splice(i, 1);
    layer.popped = true;
    event.stopImmediatePropagation();
    layer.close();
    return;
  }
  // an entry left behind by a popup that was closed while the page changed: go on to the real previous page
  if (stateOf().tazahatLayer !== undefined) {
    event.stopImmediatePropagation();
    skip += 1;
    window.history.back();
    return;
  }
  for (const fn of fallbacks) fn();
}

function listen() {
  if (listening) return;
  listening = true;
  // capture phase: runs before the listener of the Next.js router, so it can keep our events from it
  window.addEventListener("popstate", onPopState, true);
}

/** adds a layer; the returned function removes it (and its history entry) */
export function pushBackLayer(close: () => void): () => void {
  listen();
  const layer: Layer = { id: nextId++, close, pushed: false, popped: false, disposed: false };
  stack.push(layer);
  const push = () => {
    if (layer.disposed) return;
    // the browser's own pushState: Next.js wraps history.pushState on the instance and would sync its router for it
    History.prototype.pushState.call(window.history, { ...(window.history.state ?? {}), tazahatLayer: layer.id }, "", window.location.href);
    layer.pushed = true;
  };
  if (skip > 0) waiting.push(push); // a Back of ours is still on its way: add the entry once it has landed
  else push();
  return () => {
    layer.disposed = true;
    const i = stack.indexOf(layer);
    if (i >= 0) stack.splice(i, 1);
    // closed by X / Esc / outside click: take the entry away, but only when it is still the one on top (the page may have changed)
    if (layer.pushed && !layer.popped && stateOf().tazahatLayer === layer.id) {
      skip += 1;
      History.prototype.back.call(window.history);
    }
  };
}

/** what to do when Back is pressed and no layer is open (the home page's exit question) */
export function onBackWithoutLayer(handler: () => void): () => void {
  listen();
  fallbacks.add(handler);
  return () => { fallbacks.delete(handler); };
}

/** run a navigation right after a layer was closed, once the history is settled (otherwise the layer's Back could undo it) */
export function navigateAfterClose(go: () => void) {
  window.setTimeout(() => { if (skip > 0) waiting.push(go); else go(); }, 80);
}

/** a popup that is open (`active`) closes when Back is pressed; `close` should start its normal closing animation */
export function useBackClose(close: () => void, active = true) {
  const latest = useRef(close);
  useEffect(() => { latest.current = close; });
  useEffect(() => {
    if (!active) return;
    return pushBackLayer(() => latest.current());
  }, [active]);
}
