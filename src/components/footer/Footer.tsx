import { getAppLinks, getLegalList } from "@/lib/server/api";
import FooterView from "./FooterView";

/** The footer: the store buttons and the legal documents come from the CRM (read on the server), the rest is the language-aware view. */
export default async function Footer() {
  const [apps, legal] = await Promise.all([getAppLinks(), getLegalList()]);
  return <FooterView apps={apps} legal={legal.filter((d) => d.footer).map((d) => ({ slug: d.slug, title: d.title }))} />;
}
