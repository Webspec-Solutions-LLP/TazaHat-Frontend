/**
 * iOS Universal Links: a product link (tazahat.in/<product-slug>) opens the TazaHat app when it is installed. Every one-word address is a
 * product, so the pages of the site itself are left out here (they stay in the browser).
 */
export const dynamic = "force-static";

const SITE_PAGES = ["aboutUs", "allCategory", "checkout", "contactUs", "delivery-service", "deliveryService", "myprofile", "orders", "priceList", "privacyPolicy", "productDetails", "products", "profile", "wishlist", "cart", "compare", "api", "uploads", "crm", "_next", "images"];

export function GET() {
  return new Response(
    JSON.stringify({
      applinks: {
        details: [
          {
            appIDs: ["PGSAUCF654.in.tazahat.tazahatApp"],
            components: [
              { "/": "/", exclude: true },
              ...SITE_PAGES.flatMap((p) => [{ "/": `/${p}`, exclude: true }, { "/": `/${p}/*`, exclude: true }]),
              { "/": "/*" },
            ],
          },
        ],
      },
    }),
    { headers: { "content-type": "application/json" } },
  );
}
