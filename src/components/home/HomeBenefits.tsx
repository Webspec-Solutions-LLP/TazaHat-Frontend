const benefits = [
  { icon: "leaf", title: "100% Fresh", description: "Farm to Home" },
  { icon: "shield", title: "Hygienic & Safe", description: "Cleaned & Packed" },
  { icon: "truck", title: "Fast & On-Time", description: "Delivery" },
  { icon: "quality", title: "Best Quality", description: "At Best Price" },
];

function BenefitIcon({ kind }: { kind: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
      {kind === "leaf" ? <>
        <path d="M9 30C3 17 18 10 39 5c3 22-4 34-19 32" fill="#28a745" />
        <path d="M8 42 32 16M16 33 14 22M23 26l10-1" stroke="#d4f5cf" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M12 29C4 29 1 21 3 13c8 2 13 8 9 16Z" fill="#65bd45" />
      </> : kind === "truck" ? <>
        <path d="M7 9h23v27H7zM30 18h9l7 10v8H30z" fill="currentColor" />
        <path d="M34 21h4l5 7h-9z" fill="#c5edff" />
        <path d="M2 16h12M1 23h10M3 30h8" stroke="#168cff" strokeWidth="3" strokeLinecap="round" />
        <circle cx="15" cy="37" r="5" fill="#07366b" stroke="white" strokeWidth="2" />
        <circle cx="37" cy="37" r="5" fill="#07366b" stroke="white" strokeWidth="2" />
      </> : <>
        {kind === "quality" ? <path d="m24 2 6 4 7 1 3 7 5 5-2 8 1 7-7 4-5 7-8-2-8 2-5-7-7-4 1-7-2-8 5-5 3-7 7-1Z" fill="currentColor" /> : <path d="M24 3c6 5 12 7 18 8v13c0 10-9 17-18 21C15 41 6 34 6 24V11c6-1 12-3 18-8Z" fill="currentColor" />}
        {kind === "quality" && <circle cx="24" cy="24" r="13" stroke="#5ec6ff" strokeWidth="2" />}
        <path d="m16 24 6 6 11-12" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </>}
    </svg>
  );
}

export default function HomeBenefits() {
  return (
    <div className="home-content-container home-benefits-container">
      <ul className="home-benefits" aria-label="Why shop with TazaHaat">
        {benefits.map(({ icon, title, description }) => (
          <li className="home-benefit" key={icon}>
            <span className="home-benefit-icon"><BenefitIcon kind={icon} /></span>
            <div><h2>{title}</h2><p>{description}</p></div>
          </li>
        ))}
      </ul>
    </div>
  );
}
