import WebSocket from "ws";
import { currentAccessToken } from "@/lib/server/session";

/**
 * The live stream of the signed-in customer (notifications as they happen).
 *
 * The browser never talks to the backend: it opens this address (Server-Sent Events, on this site), and this server holds the websocket
 * to the backend for it and passes every message on. The token stays in the httpOnly cookie. When the connection ends (a deploy, a
 * network change) the browser's EventSource reconnects by itself.
 */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const API_BASE = (process.env.API_BASE_URL ?? "http://localhost:8000").replace(/\/$/, "");
const wsAddress = (token: string) => `${API_BASE.replace(/^http/, "ws")}/ws?token=${encodeURIComponent(token)}`;
const HEARTBEAT_MS = 20_000;

export async function GET(request: Request) {
  const token = await currentAccessToken();
  if (!token) return new Response(null, { status: 401 });

  const encoder = new TextEncoder();
  let socket: WebSocket | null = null;
  let heartbeat: ReturnType<typeof setInterval> | undefined;
  let finished = false;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (chunk: string) => { if (!finished) { try { controller.enqueue(encoder.encode(chunk)); } catch { /* the reader is gone */ } } };
      const finish = () => {
        if (finished) return;
        finished = true;
        clearInterval(heartbeat);
        try { socket?.close(); } catch { /* already closed */ }
        try { controller.close(); } catch { /* already closed */ }
      };

      socket = new WebSocket(wsAddress(token));
      socket.on("message", (raw) => send(`data: ${raw.toString()}\n\n`));
      socket.on("close", finish);
      socket.on("error", finish);
      // a comment line now and then keeps proxies (Cloudflare, nginx) from closing an idle stream
      heartbeat = setInterval(() => send(": ping\n\n"), HEARTBEAT_MS);
      send("retry: 5000\n\n");
      request.signal.addEventListener("abort", finish);
    },
    cancel() {
      finished = true;
      clearInterval(heartbeat);
      try { socket?.close(); } catch { /* already closed */ }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
