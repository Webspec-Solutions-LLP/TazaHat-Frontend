import type { Metadata } from "next";
import Navbar from "@/components/navbar/Navbar";
import Footer from "@/components/footer/Footer";
import FloatingMessageButton from "@/components/floatingMessage/FloatingMessageButton";
import BottomNavigation from "@/components/bottomNavigation/BottomNavigation";
import FeedbackButton from "@/components/feedbackButton/FeedbackButton";
import HomeBackConfirmation from "@/components/modals/confermation/HomeBackConfirmation";
import WishlistSync from "@/components/home/WishlistSync";
import CitySync from "@/components/home/CitySync";
import CartSync from "@/components/home/CartSync";
import CompareSync from "@/components/modals/compareList/CompareSync";
import { CityProvider } from "@/lib/city";
import { AuthProvider } from "@/lib/auth";
import { readCityCookie } from "@/lib/server/city";
import { getAppLinks, getUiConfig } from "@/lib/server/api";
import { SITE_DESCRIPTION, SITE_TAGLINE, getSiteIdentity } from "@/lib/server/site";
import AppDownloadSheet from "@/components/share/AppDownloadSheet";
import "./Home.css";

/** The shop's identity comes from the CRM (name, logo, favicon): the tab icon, the share card and the search result all follow it. */
export async function generateMetadata(): Promise<Metadata> {
  const id = await getSiteIdentity();
  return {
    metadataBase: new URL(id.origin),
    applicationName: id.name,
    title: { default: `${id.name} | ${SITE_TAGLINE}`, template: `%s | ${id.name}` },
    description: SITE_DESCRIPTION,
    keywords: ["fresh fish online", "buy fish online", "meat delivery", "chicken", "mutton", "vegetables", "groceries", "online fish market", id.name],
    manifest: "/manifest.webmanifest",
    icons: { icon: [{ url: "/favicon.ico" }], shortcut: "/favicon.ico", apple: id.logo },
    alternates: { canonical: "/" },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
    openGraph: { type: "website", siteName: id.name, locale: "en_IN", title: `${id.name} | ${SITE_TAGLINE}`, description: SITE_DESCRIPTION, url: "/", images: [{ url: id.logo, alt: id.name }] },
    twitter: { card: "summary_large_image", title: `${id.name} | ${SITE_TAGLINE}`, description: SITE_DESCRIPTION, images: [id.logo] },
    formatDetection: { telephone: false },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const city = await readCityCookie();
  const [apps, ui, id] = await Promise.all([getAppLinks(), getUiConfig(), getSiteIdentity()]);
  const ld = [
    { "@context": "https://schema.org", "@type": "Organization", name: id.name, url: id.origin, logo: id.logo, ...(id.phone ? { telephone: id.phone } : {}), ...(id.email ? { email: id.email } : {}) },
    { "@context": "https://schema.org", "@type": "WebSite", name: id.name, url: id.origin, potentialAction: { "@type": "SearchAction", target: `${id.origin}/products?q={search_term_string}`, "query-input": "required name=search_term_string" } },
  ];
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />
        <CityProvider value={city}>
        <AuthProvider>
        <CompareSync />
        <CitySync />
        <CartSync />
        <WishlistSync />
        <Navbar />
        <main className="flex-1 frontend-layout-main">{children}</main>
        <Footer />
        <FloatingMessageButton />
        <BottomNavigation />
        {ui.feedbackButton && <FeedbackButton />}
        <HomeBackConfirmation />
        <AppDownloadSheet android={apps.android} ios={apps.ios} />
        </AuthProvider>
        </CityProvider>
      </body>
    </html>
  );
}
