"use client";

import type { ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import "./RequireLogin.css";

/** Pages of the signed-in customer: without a login they show a short invitation to log in instead of the page. */
export default function RequireLogin({ what, children }: { what: string; children: ReactNode }) {
  const { user, ready, openLogin } = useAuth();
  // not known yet whether someone is signed in: keep the room, show nothing that could flash
  if (!ready) return <div className="require-login require-login--wait" aria-busy="true"><span className="sr-only">Checking your login…</span></div>;
  if (user) return <>{children}</>;
  return (
    <section className="require-login" aria-labelledby="require-login-title">
      <span className="require-login-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" /></svg>
      </span>
      <h1 id="require-login-title">Please log in</h1>
      <p>Log in with your mobile number to see {what}.</p>
      <button type="button" onClick={() => openLogin()}>Log in</button>
    </section>
  );
}
