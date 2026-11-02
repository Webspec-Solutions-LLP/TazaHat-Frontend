import { getAppLinks } from "@/lib/server/api";
import FooterView from "./FooterView";

/** The footer: the store buttons come from the CRM settings (read on the server), the rest is the language-aware view. */
export default async function Footer() {
  const apps = await getAppLinks();
  return <FooterView apps={apps} />;
}
