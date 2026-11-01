import { getPushConfig } from "@/lib/server/api";

/**
 * The service worker that shows a notification when the site is not open (Firebase Cloud Messaging for the web). It has to be served from
 * the site root; the Firebase project's web config is filled in from the CRM settings, so nothing is hard-coded here.
 */
export const dynamic = "force-dynamic";

const SDK = "11.10.0";

export async function GET() {
  const c = await getPushConfig();
  const body = c.enabled && c.config
    ? `importScripts("https://www.gstatic.com/firebasejs/${SDK}/firebase-app-compat.js", "https://www.gstatic.com/firebasejs/${SDK}/firebase-messaging-compat.js");
firebase.initializeApp(${JSON.stringify(c.config)});
// firebase shows the notification itself when the message carries one; this only decides where a tap goes
firebase.messaging();
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const data = (event.notification.data && (event.notification.data.FCM_MSG ? event.notification.data.FCM_MSG.data : event.notification.data)) || {};
  const path = data.url || (data.slug ? "/" + encodeURIComponent(data.slug) : data.orderNumber ? "/orders/" + encodeURIComponent(data.orderNumber) : "/");
  event.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
    for (const client of list) { if ("focus" in client) { client.navigate(path); return client.focus(); } }
    return self.clients.openWindow(path);
  }));
});
`
    : `// push notifications are not set up yet (CRM: Settings > Push)\n`;
  return new Response(body, { headers: { "content-type": "application/javascript; charset=utf-8", "cache-control": "no-store", "service-worker-allowed": "/" } });
}
