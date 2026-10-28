import Link from "next/link";
import "./About.css";

const values = [
  { number: "01", title: "Freshness comes first", text: "We work to bring fresh produce and everyday essentials from trusted local sources to your home." },
  { number: "02", title: "Local roots, local care", text: "Our Tripura roots keep us close to the growers, vendors and communities we serve." },
  { number: "03", title: "A simpler way to shop", text: "Browse, choose a delivery option and place your order in a few easy steps." },
];

const steps = [
  { title: "We source with care", text: "We connect with local growers and suppliers to bring quality ingredients and daily essentials together." },
  { title: "We prepare your order", text: "Your selections are gathered and checked before they head out for delivery." },
  { title: "We bring it to you", text: "Our delivery network helps get your order to homes across our service areas." },
];

function LeafIcon() {
  return <svg viewBox="0 0 48 48" fill="none" aria-hidden="true"><path d="M39 8C23 8 11 14 11 27c0 7 5 12 12 12C36 39 40 23 39 8Z"/><path d="M9 40c5-11 12-17 23-24M19 30l-1-9m7 3 8-1"/></svg>;
}

export default function AboutUsPage() {
  return (
    <main className="about-page">
      <div className="about-container">
        <nav className="about-breadcrumb" aria-label="Breadcrumb"><Link href="/">Home</Link><span aria-hidden="true">/</span><span>About Us</span></nav>

        <section className="about-hero" aria-labelledby="about-title">
          <div className="about-hero-copy">
            <span className="about-eyebrow"><i aria-hidden="true" /> YOUR NEIGHBOURHOOD MARKET, ONLINE</span>
            <h1 id="about-title">Good food and daily essentials, <em>closer to home.</em></h1>
            <p>TazaHaat makes everyday shopping simpler. We bring fresh produce and household essentials together, with the care of a local market and the convenience of online ordering.</p>
            <div className="about-hero-actions"><Link className="about-button about-button--primary" href="/products">Explore products <span aria-hidden="true">→</span></Link><Link className="about-text-link" href="/contactUs">Get in touch <span aria-hidden="true">↗</span></Link></div>
            <div className="about-hero-note"><span className="about-note-icon"><LeafIcon /></span><span><strong>Rooted in Tripura</strong><small>Serving our community with care</small></span></div>
          </div>
          <div className="about-hero-art" aria-label="Fresh produce illustration">
            <div className="about-art-sun" />
            <div className="about-art-label"><span>FRESH PICKS</span><strong>From our<br />community</strong><i aria-hidden="true">✳</i></div>
            <div className="about-produce about-produce--leaf"><LeafIcon /></div>
            <div className="about-produce about-produce--tomato"><span /><i /><b /></div>
            <div className="about-produce about-produce--citrus"><i /><b /></div>
            <div className="about-produce about-produce--berry"><i /><b /><em /></div>
            <div className="about-art-caption"><span>FRESH</span><span>LOCAL</span><span>THOUGHTFUL</span></div>
          </div>
        </section>

        <section className="about-intro" aria-labelledby="about-intro-title">
          <div className="about-intro-heading"><span className="about-section-label">A LITTLE ABOUT US</span><h2 id="about-intro-title">A market that feels <em>like yours.</em></h2></div>
          <div className="about-intro-copy"><p>TazaHaat was created around a simple idea: shopping for the things you need should feel easy, dependable and close to home. We bring products from local suppliers and everyday favourites into one convenient place.</p><p>From choosing your groceries to getting them delivered, we want every part of the experience to feel thoughtful. We’re growing with our community, one order at a time.</p></div>
        </section>

        <section className="about-values" aria-label="What matters to us">
          {values.map((value) => <article className="about-value-card" key={value.number}><span className="about-value-number">{value.number}</span><span className="about-value-mark" aria-hidden="true">✳</span><h3>{value.title}</h3><p>{value.text}</p></article>)}
        </section>

        <section className="about-story" aria-labelledby="about-story-title">
          <div className="about-story-visual"><div className="about-story-orbit about-story-orbit--one"/><div className="about-story-orbit about-story-orbit--two"/><div className="about-story-stamp"><span>TAZahaat</span><strong>GOOD<br/>THINGS<br/>GROW HERE</strong><i>✳</i></div><span className="about-story-sprout" aria-hidden="true"><LeafIcon /></span><span className="about-story-dot about-story-dot--one"/><span className="about-story-dot about-story-dot--two"/></div>
          <div className="about-story-copy"><span className="about-section-label">FROM SOURCE TO DOOR</span><h2 id="about-story-title">A little more care at <em>every step.</em></h2><p>Behind every order is a network of people who care about what reaches your table. We’re building a smoother connection between local suppliers and the homes they serve.</p><div className="about-steps">{steps.map((step, index) => <article className="about-step" key={step.title}><span className="about-step-index">0{index + 1}</span><div><h3>{step.title}</h3><p>{step.text}</p></div></article>)}</div></div>
        </section>

        <section className="about-cta" aria-labelledby="about-cta-title"><span className="about-cta-spark about-cta-spark--one" aria-hidden="true">✳</span><span className="about-cta-spark about-cta-spark--two" aria-hidden="true">✳</span><div><span className="about-cta-label">WE’RE GLAD YOU’RE HERE</span><h2 id="about-cta-title">Let’s make everyday shopping <em>a little brighter.</em></h2><p>Discover TazaHaat and find what your home needs today.</p></div><Link className="about-button about-button--light" href="/products">Start exploring <span aria-hidden="true">→</span></Link></section>
      </div>
    </main>
  );
}
