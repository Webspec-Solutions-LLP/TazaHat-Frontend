import React from "react";
import Image from "next/image";
import Link from "next/link";
import { getAppLinks, type AppLink } from "@/lib/server/api";
import "./Footer.css";

function AppStoreBadge() {
  return (
    <svg className="footer-play-image footer-ios-badge" viewBox="0 0 180 53" role="img" aria-label="Download on the App Store">
      <rect x="0.5" y="0.5" width="179" height="52" rx="9" fill="#000" stroke="#a6a6a6" />
      <path transform="translate(16 12) scale(1.15)" fill="#fff" d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
      <text x="52" y="21" fill="#fff" fontSize="9.5" fontFamily="-apple-system, Helvetica, Arial, sans-serif">Download on the</text>
      <text x="51" y="40" fill="#fff" fontSize="20" fontWeight="600" fontFamily="-apple-system, Helvetica, Arial, sans-serif">App Store</text>
    </svg>
  );
}

/** one store button: a link when the CRM has the address, "Coming soon" when it has not, nothing when it is switched off */
function StoreButton({ link, label, children }: { link: AppLink; label: string; children: React.ReactNode }) {
  if (link.state === "hidden") return null;
  if (link.state === "link") return <a className="footer-play-badge" href={link.url} target="_blank" rel="noopener noreferrer" aria-label={label}>{children}</a>;
  return <span className="footer-play-badge is-soon" aria-label={`${label} - coming soon`}>{children}<span className="footer-soon-tag">Coming soon</span></span>;
}

export default async function Footer() {
  const apps = await getAppLinks();
  return (
    <footer className="tazahat-footer" aria-label="Site footer">
      <div className="tazahat-footer-inner">
        {/* Top Section */}
        <div className="footer-top">
          {/* Brand Column */}
          <div className="footer-brand-col">
            <Link href="/" className="footer-logo-link" aria-label="TazaHaat Home">
              <span className="footer-brand-lockup">
              <Image
                src="/images/logo.webp"
                alt="TazaHaat Logo"
                width={120}
                height={52}
                className="footer-logo-img"
              />
                <span className="footer-brand-name">Taza<span>Haat</span></span>
              </span>
              <span className="footer-tagline">
                — Fresh Food, Healthier You, Delivered —
              </span>
            </Link>

            <p className="footer-desc">
              Your one-stop destination for fresh fish, meat, vegetables, fruits,
              dairy and daily essentials.
            </p>

            {/* Social Links */}
            <div className="footer-social-links" aria-label="Social links">
              {/* Facebook */}
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-social-btn"
                aria-label="Facebook"
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>

              {/* Instagram */}
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-social-btn"
                aria-label="Instagram"
              >
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </a>

              {/* YouTube */}
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-social-btn"
                aria-label="YouTube"
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Links Grid */}
          <div className="footer-links-grid">
            {/* Quick Links */}
            <div className="footer-links-col">
              <h3 className="footer-col-title">Quick Links</h3>
              <ul className="footer-links-list">
                <li>
                  <Link href="/" className="footer-link">
                    Home
                  </Link>
                </li>
                <li>
                  <Link href="/products" className="footer-link">
                    Products
                  </Link>
                </li>
                <li>
                  <Link href="/myOrders" className="footer-link">
                    My Orders
                  </Link>
                </li>
                <li>
                  <Link href="/delivery-service" className="footer-link">
                    Delivery Service
                  </Link>
                </li>
                <li>
                  <Link href="/priceList" className="footer-link">
                    Price List
                  </Link>
                </li>
              </ul>
            </div>

            {/* Need Help? */}
            <div className="footer-links-col">
              <h3 className="footer-col-title">Need Help?</h3>
              <ul className="footer-links-list">
                <li>
                  <Link href="/contactUs" className="footer-link">
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link href="/aboutUs" className="footer-link">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="/privacyPolicy" className="footer-link">
                    Privacy & Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="footer-seller-card">
            <div className="footer-seller-heading">
              <svg className="footer-store-icon" viewBox="0 0 64 64" fill="none" aria-hidden="true"><path d="M10 26h44v32H10z" fill="#e7f2ff"/><path d="M7 26 14 8h36l7 18" fill="#8bc943"/><path d="m20 8-3 18m15-18v18M44 8l3 18" stroke="#fff" strokeWidth="7"/><path d="M7 26h50v6H7z" fill="#b5e278"/><path d="M16 39h12v19H16zM36 38h12v12H36z" fill="#08609e"/><path d="M6 58h52" stroke="#a3c9ec" strokeWidth="4"/></svg>
              <div><h3>Become a Seller</h3><p>List your fresh products and reach more customers with TazaHaat.</p></div>
            </div>
            <Link href="/sell-with-us" className="footer-sell-button">Sell with Us <span aria-hidden="true">&rarr;</span></Link>
            <div className="footer-seller-links"><Link href="/seller-guidelines">Seller Guidelines</Link><Link href="/partnership">Partnership Program</Link></div>
            <Image src="/images/category/category2.webp?v=transparent-2" alt="" width={120} height={120} unoptimized className="footer-seller-produce" />
          </div>
          <div className="footer-app-col">
            <h3 className="footer-col-title">Get Our App</h3>
            <p>Shop fresh groceries<br />anytime, anywhere.</p>
            {(apps.android.state !== "hidden" || apps.ios.state !== "hidden") && (
              <div className="footer-store-buttons">
                <StoreButton link={apps.android} label="Get it on Google Play"><Image src="/images/playstore_img.webp" alt="Get it on Google Play" width={715} height={212} className="footer-play-image" /></StoreButton>
                <StoreButton link={apps.ios} label="Download on the App Store"><AppStoreBadge /></StoreButton>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom">
          <p className="footer-bottom-copy">
            © 2026 TazaHaat. All Rights Reserved.
          </p>
          <nav className="footer-legal" aria-label="Legal links"><Link href="/privacy-policy">Privacy Policy</Link><Link href="/terms-conditions">Terms &amp; Conditions</Link><Link href="/seller-options">Seller Options</Link></nav>
          <p className="footer-bottom-values">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="footer-heart-icon"
              aria-hidden="true"
            >
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
            <span>Fresh Food</span>
            <span>•</span>
            <span>Healthy Life</span>
            <span>•</span>
            <span>Happy Family</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
