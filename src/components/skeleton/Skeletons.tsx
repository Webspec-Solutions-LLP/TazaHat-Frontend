import "./Skeleton.css";

const range = (n: number) => Array.from({ length: n }, (_, i) => i);

function Busy({ label, children, className = "sk-section" }: { label: string; children: React.ReactNode; className?: string }) {
  return <section className={className} role="status" aria-busy="true" aria-label={label}><span className="sr-only">{label}</span>{children}</section>;
}
function Head() {
  return <div className="sk-head" aria-hidden="true"><div className="sk sk-title" /><div className="sk sk-sub" /></div>;
}

/** One product card while it loads. */
export function ProductCardSkeleton() {
  return (
    <div className="sk-card" aria-hidden="true">
      <div className="sk sk-card-img" />
      <div className="sk sk-line sk-line--mid" />
      <div className="sk sk-line" />
      <div className="sk sk-line sk-line--price" />
      <div className="sk sk-line sk-line--mid" />
      <div className="sk-card-actions"><div className="sk" /><div className="sk" /></div>
    </div>
  );
}

/** Cards only (to put inside a grid that is already on the page, e.g. while the next page of a list loads). */
export function ProductCardsSkeleton({ count = 5 }: { count?: number }) {
  return <>{range(count).map(i => <ProductCardSkeleton key={i} />)}</>;
}

/** A shelf: title + one row of cards. */
export function ProductShelfSkeleton({ count = 6, label = "Loading products" }: { count?: number; label?: string }) {
  return (
    <Busy label={label}>
      <Head />
      <div className="sk-row">{range(count).map(i => <ProductCardSkeleton key={i} />)}</div>
    </Busy>
  );
}

/** A list of cards in several rows, in the same columns as the real grid. */
export function ProductGridSkeleton({ count = 10, label = "Loading products", heading = true }: { count?: number; label?: string; heading?: boolean }) {
  return (
    <Busy label={label}>
      {heading && <Head />}
      <div className="sk-grid">{range(count).map(i => <ProductCardSkeleton key={i} />)}</div>
    </Busy>
  );
}

export function HeroSkeleton() {
  return (
    <Busy label="Loading banners">
      <div className="sk-hero" aria-hidden="true">
        <div className="sk sk-hero-main" />
        <div className="sk-hero-side"><div className="sk" /><div className="sk" /></div>
      </div>
    </Busy>
  );
}

export function CategoryRowSkeleton() {
  return (
    <Busy label="Loading categories">
      <Head />
      <div className="sk-row" style={{ gap: 10 }}>
        {range(6).map(i => <div className="sk-tile" key={i} aria-hidden="true"><div className="sk sk-tile-img" /><div className="sk sk-line sk-line--mid" /><div className="sk sk-line sk-line--short" /></div>)}
      </div>
    </Busy>
  );
}

export function BestSellerSkeleton() {
  return (
    <Busy label="Loading best sellers">
      <Head />
      <div className="sk-row">
        {range(5).map(i => <div className="sk-tile" key={i} aria-hidden="true"><div className="sk sk-tile-img" style={{ aspectRatio: "1.1 / 1" }} /><div className="sk sk-line sk-line--mid" /></div>)}
      </div>
    </Busy>
  );
}

/** A big offer banner with a row of cards under it. */
export function OfferBlockSkeleton({ label = "Loading offers" }: { label?: string }) {
  return (
    <Busy label={label}>
      <div className="sk sk-block" aria-hidden="true" />
      <div className="sk-row">{range(6).map(i => <ProductCardSkeleton key={i} />)}</div>
    </Busy>
  );
}

/** Today's deals + categories + the "fresh in your city" shelf. */
export function HomeTopSkeleton() {
  return <><ProductShelfSkeleton label="Loading today's deals" /><CategoryRowSkeleton /><ProductShelfSkeleton label="Loading fresh products" /></>;
}

/** Best sellers + the offer sections. */
export function HomeMiddleSkeleton() {
  return <><BestSellerSkeleton /><OfferBlockSkeleton label="Loading fresh picks" /><ProductShelfSkeleton label="Loading special deals" /><ProductShelfSkeleton label="Loading steal deals" /></>;
}

/** Filters + product list. */
export function CatalogSkeleton() {
  return (
    <main className="products-section" aria-busy="true">
      <div className="sk-section sk-catalog" role="status" aria-label="Loading products">
        <span className="sr-only">Loading products</span>
        <div className="sk-filters" aria-hidden="true">{range(9).map(i => <div key={i} className="sk sk-line" style={{ width: `${55 + ((i * 17) % 40)}%`, height: i % 4 === 0 ? 16 : 12 }} />)}</div>
        <div>
          <div className="sk-head" aria-hidden="true"><div className="sk sk-title" /><div className="sk sk-sub" /></div>
          <div className="sk-grid" style={{ gridTemplateColumns: undefined }}>{range(10).map(i => <ProductCardSkeleton key={i} />)}</div>
        </div>
      </div>
    </main>
  );
}

/** The product page. */
export function ProductPageSkeleton() {
  return (
    <main className="product-details-page" aria-busy="true">
      <div className="sk-section sk-product" role="status" aria-label="Loading product">
        <span className="sr-only">Loading product</span>
        <div className="sk sk-product-img" aria-hidden="true" />
        <div className="sk-product-info" aria-hidden="true">
          <div className="sk sk-title" style={{ width: "70%", height: 30 }} />
          <div className="sk sk-line sk-line--price" style={{ height: 26 }} />
          <div className="sk sk-line sk-line--short" />
          <div style={{ display: "flex", gap: 10 }}><div className="sk" style={{ width: 120, height: 42 }} /><div className="sk" style={{ width: 120, height: 42 }} /></div>
          <div className="sk" style={{ height: 44 }} />
          <div className="sk" style={{ height: 46 }} />
          <div className="sk sk-line" /><div className="sk sk-line sk-line--mid" /><div className="sk sk-line sk-line--short" />
        </div>
      </div>
    </main>
  );
}

/** Rows for the navbar search suggestions. */
export function SearchSuggestionSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div role="status" aria-label="Searching" aria-busy="true">
      <span className="sr-only">Searching…</span>
      {range(rows).map(i => <div className="sk-suggest" key={i} aria-hidden="true"><div className="sk" /><div className="sk-suggest-text"><div className="sk sk-line sk-line--mid" /><div className="sk sk-line sk-line--short" /></div></div>)}
    </div>
  );
}
