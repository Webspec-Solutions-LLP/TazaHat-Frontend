import Link from "next/link";
import { loadHome } from "@/lib/server/home";
import { shortName } from "@/lib/api";
import "./HeaderTicker.css";

/**
 * The thin strip under the header (it sticks with the header): on the left the names of today's products drift slowly from right to
 * left, each one a link to its page; on the right a few shortcuts. Server rendered, the movement is plain CSS (pauses when the mouse
 * is over it, still when the visitor asked for less motion).
 */
const SHORTCUTS = [
  { label: "Today's Deals", href: "/products?sort=discount" },
  { label: "All Categories", href: "/allCategory" },
  { label: "Price List", href: "/priceList" },
];
const MAX_NAMES = 30;
const SECONDS_PER_NAME = 6.5; // about 30 px per second: slow enough to read

const Arrow = () => (
  <svg className="header-ticker-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6" /></svg>
);

/** keeps the strip's height while the names are on their way */
export function HeaderTickerFallback() {
  return <div className="header-ticker header-ticker--loading" aria-hidden="true"><div className="header-ticker-inner" /></div>;
}

export default async function HeaderTicker({ cityId }: { cityId: string }) {
  const home = await loadHome(cityId);
  const names: { slug: string; name: string }[] = [];
  if ("data" in home) {
    const seen = new Set<string>();
    for (const card of [...home.data.special, ...home.data.offers.items, ...home.data.latest, ...home.data.bestSellers]) {
      if (seen.has(card.slug)) continue;
      seen.add(card.slug);
      names.push({ slug: card.slug, name: shortName(card.name) });
      if (names.length >= MAX_NAMES) break;
    }
  }
  const list = (hidden: boolean) => (
    <ul className="header-ticker-list" aria-hidden={hidden || undefined}>
      {names.map((item) => (
        <li key={item.slug}>
          <Link href={`/${encodeURIComponent(item.slug)}`} tabIndex={hidden ? -1 : undefined}>{item.name}</Link>
          <Arrow />
        </li>
      ))}
    </ul>
  );
  return (
    <div className="header-ticker" role="region" aria-label="Today's products and shortcuts">
      <div className="header-ticker-inner">
        {names.length > 0 ? (
          <div className="header-ticker-marquee">
            <div className="header-ticker-track" style={{ ["--ticker-seconds" as string]: `${Math.max(40, names.length * SECONDS_PER_NAME)}s` }}>
              {list(false)}
              {list(true)}
            </div>
          </div>
        ) : <div className="header-ticker-marquee" />}
        <nav className="header-ticker-links" aria-label="Shortcuts">
          {SHORTCUTS.map((s) => <Link key={s.label} href={s.href}>{s.label}</Link>)}
        </nav>
      </div>
    </div>
  );
}
