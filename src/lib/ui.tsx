"use client";
import { createContext, useContext } from "react";

/** The switches of CRM > Settings > Shop buttons, for client components. Compare is off until the CRM turns it on. */
export type Ui = { feedbackButton: boolean; compareButton: boolean };
const UiCtx = createContext<Ui>({ feedbackButton: true, compareButton: false });
export function UiProvider({ ui, children }: { ui: Ui; children: React.ReactNode }) {
  return <UiCtx.Provider value={ui}>{children}</UiCtx.Provider>;
}
export const useUi = () => useContext(UiCtx);
