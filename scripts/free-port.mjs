#!/usr/bin/env node
/**
 * Frees TCP ports before a dev server starts: whatever is already listening on them (usually the previous run of the same app, or one that hung)
 * is stopped, so the new one can take the port instead of failing with "address already in use".
 *
 *   node scripts/free-port.mjs 8000 3001
 *
 * Asks the process to stop (SIGTERM) first, then forces it (SIGKILL) if it is still there after 3 seconds. Works on macOS, Linux and Windows.
 * Prints what it stopped. Only run it for ports that belong to this project.
 */
import { execFileSync, spawnSync } from "node:child_process";
import net from "node:net";

const ports = process.argv.slice(2).map(Number).filter((n) => Number.isInteger(n) && n > 0 && n < 65536);
const win = process.platform === "win32";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const inUse = (port) => new Promise((res) => { const s = net.connect({ host: "127.0.0.1", port, timeout: 600 }); s.once("connect", () => { s.destroy(); res(true); }); s.once("timeout", () => { s.destroy(); res(false); }); s.once("error", () => res(false)); });

/** process ids listening on the port */
function pidsOn(port) {
  try {
    if (win) {
      const out = execFileSync("netstat", ["-ano", "-p", "tcp"], { encoding: "utf8" });
      return [...new Set(out.split(/\r?\n/).filter((l) => /LISTENING/i.test(l) && new RegExp(`[:.]${port}\\s`).test(l)).map((l) => Number(l.trim().split(/\s+/).pop())).filter(Boolean))];
    }
    const out = spawnSync("lsof", ["-nP", `-iTCP:${port}`, "-sTCP:LISTEN", "-t"], { encoding: "utf8" }).stdout;
    return [...new Set(out.split(/\s+/).map(Number).filter(Boolean))];
  } catch { return []; }
}
function nameOf(pid) {
  try {
    if (win) return execFileSync("tasklist", ["/FI", `PID eq ${pid}`, "/FO", "CSV", "/NH"], { encoding: "utf8" }).split(",")[0].replace(/"/g, "");
    return execFileSync("ps", ["-o", "command=", "-p", String(pid)], { encoding: "utf8" }).trim().slice(0, 70);
  } catch { return ""; }
}
function stop(pid, force) {
  try {
    if (win) spawnSync("taskkill", ["/PID", String(pid), "/T", ...(force ? ["/F"] : [])]);
    else process.kill(pid, force ? "SIGKILL" : "SIGTERM");
  } catch { /* already gone */ }
}

for (const port of ports) {
  const pids = pidsOn(port).filter((p) => p !== process.pid && p !== process.ppid);
  if (!pids.length) continue;
  for (const pid of pids) { console.log(`• port ${port} is busy (pid ${pid}: ${nameOf(pid)}) - stopping it`); stop(pid, false); }
  for (let t = 0; t < 3000 && (await inUse(port)); t += 250) await sleep(250);
  if (await inUse(port)) { for (const pid of pidsOn(port)) stop(pid, true); await sleep(500); }
  console.log((await inUse(port)) ? `✗ port ${port} is still busy - close the program using it` : `✓ port ${port} is free`);
}
