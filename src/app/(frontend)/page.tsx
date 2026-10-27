"use client";

import { useState } from "react";
import HomeHero from "@/components/home/HomeHero";
import HomeBenefits from "@/components/home/HomeBenefits";
import Category from "@/components/category/Category";
import Products from "@/components/products/Products";
import TodalDeals from "@/components/todayDeals/TodalDeals";
import OfferLayout1 from "@/components/offerLayout1/OfferLayout1";
import OfferLayout2 from "@/components/offerLayout2/OfferLayout2";
import OfferLayout3 from "@/components/offerLayout3/OfferLayout3";
import OfferLayout4 from "@/components/offerLayout4/OfferLayout4";
import BestSeller from "@/components/bestSeller/BestSeller";
import "./Home.css";

export default function Home() {
  const [newsletterMessage, setNewsletterMessage] = useState("");
  return (
    <>
      <HomeHero />
      <TodalDeals />
      <Category />
      <Products />
      <OfferLayout1 />
      <HomeBenefits />
      <BestSeller />
      <OfferLayout2 />
      <OfferLayout3 />
      <OfferLayout4 />
      <section className="home-newsletter" aria-labelledby="newsletter-heading">
        <div className="home-newsletter-copy">
          <span className="home-newsletter-icon" aria-hidden="true">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 6 8 7 8-7" /></svg>
          </span>
          <div><h2 id="newsletter-heading">Get Updates &amp; Exclusive Offers</h2><p>Subscribe to our newsletter and never miss a deal.</p></div>
        </div>
        <form className="home-newsletter-form" onSubmit={event => {
          event.preventDefault();
          setNewsletterMessage("Newsletter subscriptions are coming soon. Please check back later.");
        }}>
          <div className="home-newsletter-fields">
            <label className="sr-only" htmlFor="newsletter-email">Email address</label>
            <input id="newsletter-email" name="email" type="email" autoComplete="email" placeholder="Enter your email address" required aria-describedby={newsletterMessage ? "newsletter-status" : undefined} />
            <button type="submit">Subscribe</button>
          </div>
          <p id="newsletter-status" className="home-newsletter-status" role="status">{newsletterMessage}</p>
        </form>
      </section>
    </>
  );
}
