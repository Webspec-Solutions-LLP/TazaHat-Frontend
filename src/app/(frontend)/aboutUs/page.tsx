import Image from "next/image";
import Link from "next/link";
import "./About.css";

const values = [
  {
    number: "01",
    title: "A thoughtful selection",
    text: "Find fresh picks, pantry staples and everyday essentials together in one convenient place.",
  },
  {
    number: "02",
    title: "Made for everyday life",
    text: "A straightforward online shopping experience helps make your regular list easier to manage.",
  },
  {
    number: "03",
    title: "Rooted close to home",
    text: "TazaHaat is built with our Tripura community in mind, bringing the neighbourhood market online.",
  },
];

const steps = [
  { number: "01", title: "Explore", text: "Browse the products your home needs, all in one place." },
  { number: "02", title: "Choose", text: "Add your favourites to the cart and review your order." },
  { number: "03", title: "Order", text: "Complete checkout and choose from the available delivery options." },
];

export default function AboutUsPage() {
  return (
    <div className="about-page">
      <div className="about-container">
        <nav className="about-breadcrumb" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">About Us</span>
        </nav>

        <section className="about-hero" aria-labelledby="about-title">
          <div className="about-hero-copy">
            <span className="about-eyebrow"><span aria-hidden="true" /> YOUR NEIGHBOURHOOD MARKET, ONLINE</span>
            <h1 id="about-title">Your everyday market, <em>made easier.</em></h1>
            <p>
              TazaHaat brings groceries, fresh picks and household essentials together
              online, so it’s easier to find what your home needs.
            </p>
            <div className="about-hero-actions">
              <Link className="about-button about-button--primary" href="/products">
                Explore products <span aria-hidden="true">→</span>
              </Link>
              <Link className="about-text-link" href="/contactUs">
                Get in touch <span aria-hidden="true">↗</span>
              </Link>
            </div>
            <div className="about-location">
              <span className="about-location-mark" aria-hidden="true">T</span>
              <span><strong>From Tripura, with care</strong><small>Here for the neighbourhood</small></span>
            </div>
          </div>
          <div className="about-hero-image">
            <Image
              src="/images/banner1.webp"
              alt="A vibrant market scene with fresh produce"
              fill
              priority
              sizes="(max-width: 760px) 100vw, 55vw"
            />
            <div className="about-image-note">
              <span>GOOD THINGS, CLOSE TO HOME</span>
              <strong>Discover your<br />everyday favourites.</strong>
            </div>
          </div>
        </section>

        <section className="about-intro" aria-labelledby="about-intro-title">
          <div className="about-intro-heading">
            <span className="about-section-label">A LITTLE ABOUT TAZAHAAT</span>
            <h2 id="about-intro-title">A simpler way to shop for <em>home.</em></h2>
          </div>
          <div className="about-intro-copy">
            <p>
              We believe getting the things you need should feel simple. TazaHaat
              brings a neighbourhood-market feel to online shopping, with a range
              that covers the everyday.
            </p>
            <p>
              Whether you’re planning the week or picking up a few essentials,
              we’re here to make the experience clear, convenient and close to home.
            </p>
          </div>
        </section>

        <section className="about-values" aria-label="What makes TazaHaat different">
          {values.map((value) => (
            <article className="about-value-card" key={value.number}>
              <span className="about-value-number">{value.number}</span>
              <span className="about-value-arrow" aria-hidden="true">↗</span>
              <h3>{value.title}</h3>
              <p>{value.text}</p>
            </article>
          ))}
        </section>

        <section className="about-story" aria-labelledby="about-story-title">
          <div className="about-story-heading">
            <span className="about-section-label">SHOPPING, YOUR WAY</span>
            <h2 id="about-story-title">From browsing to order, <em>made simple.</em></h2>
            <p>Everything you need for a smoother online shopping experience, in three easy steps.</p>
            <Link className="about-story-link" href="/products">
              Start shopping <span aria-hidden="true">→</span>
            </Link>
          </div>
          <div className="about-steps">
            {steps.map((step) => (
              <article className="about-step" key={step.number}>
                <span className="about-step-number">{step.number}</span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="about-cta" aria-labelledby="about-cta-title">
          <div>
            <span className="about-cta-label">YOUR NEIGHBOURHOOD, A CLICK AWAY</span>
            <h2 id="about-cta-title">Make room for <em>easier everyday shopping.</em></h2>
            <p>Take a look around TazaHaat and find something for your home.</p>
          </div>
          <Link className="about-button about-button--light" href="/products">
            Browse products <span aria-hidden="true">→</span>
          </Link>
        </section>
      </div>
    </div>
  );
}
