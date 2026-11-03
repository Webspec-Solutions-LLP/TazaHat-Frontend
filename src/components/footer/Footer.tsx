import { getAppLinks, getLegalList } from "@/lib/server/api";
import FooterView from "./FooterView";

const BOTTOM = ["contact-us", "about-us"]; // shown in the bottom line of the footer, in this order

/** The footer: the store buttons and the documents come from the CRM (read on the server); only what the CRM has set is shown. */
export default async function Footer() {
  const [apps, docs] = await Promise.all([getAppLinks(), getLegalList()]);
  const shown = docs.filter((d) => d.footer).map((d) => ({ slug: d.slug, title: d.title }));
  const bottom = BOTTOM.map((slug) => shown.find((d) => d.slug === slug)).filter((d): d is { slug: string; title: string } => !!d);
  return <FooterView apps={apps} legal={shown.filter((d) => !BOTTOM.includes(d.slug))} bottom={bottom} />;
}
