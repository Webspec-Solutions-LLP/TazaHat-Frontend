"use client";

import { useState } from "react";
import faqContent from "./english.json";
import "./Faq.css";

export default function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="contact-faq" aria-labelledby="contact-faq-title">
      <div className="contact-faq-heading">
        <h2 id="contact-faq-title">{faqContent.title}</h2>
      </div>
      <div className="contact-faq-grid">
        {faqContent.items.map((item, index) => {
          const isOpen = openIndex === index;
          const answerId = `contact-faq-answer-${index}`;
          return (
            <article className={`contact-faq-card${isOpen ? " is-open" : ""}`} key={item.question}>
              <button type="button" className="contact-faq-question" aria-expanded={isOpen} aria-controls={answerId} onClick={() => setOpenIndex(isOpen ? null : index)}>
                <span>{item.question}</span><span className="contact-faq-toggle" aria-hidden="true">{isOpen ? "−" : "+"}</span>
              </button>
              {isOpen && <p className="contact-faq-answer" id={answerId}>{item.answer}</p>}
            </article>
          );
        })}
      </div>
    </section>
  );
}
