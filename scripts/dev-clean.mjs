#!/usr/bin/env node
/**
 * Keeps the Next.js dev cache healthy before `next dev` starts (run from the dev scripts, in the app folder given or the current one).
 *  - removes a stale lock file left by a server that was stopped hard;
 *  - when the Turbopack cache (.next/dev) has grown past 1.5 GB - it only ever grows, and a very large one causes slow starts and
 *    "ChunkLoadError: Failed to load chunk" in the browser - it is deleted; the next start rebuilds it (the first page is slower once).
 *
 *   node scripts/dev-clean.mjs [app folder]
 */
import { execFileSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import path from "node:path";

const app = path.resolve(process.argv[2] ?? ".");
const dev = path.join(app, ".next", "dev");
if (!existsSync(dev)) process.exit(0);

const lock = path.join(dev, "lock");
if (existsSync(lock)) { try { rmSync(lock, { force: true }); } catch { /* in use: a live server holds it */ } }

function sizeMb() {
  try {
    if (process.platform === "win32") return 0; // no cheap size check: left alone
    return Number(execFileSync("du", ["-sk", dev], { encoding: "utf8" }).split(/\s+/)[0]) / 1024;
  } catch { return 0; }
}
const mb = sizeMb();
if (mb > 1536) {
  console.log(`• dev cache is ${(mb / 1024).toFixed(1)} GB - clearing it (the next start rebuilds it, the first page is slower once)`);
  rmSync(dev, { recursive: true, force: true });
}
