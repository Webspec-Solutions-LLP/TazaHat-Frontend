"use client";

import { useState } from "react";
import englishText from "./english.json";
import bengaliText from "./bengali.json";
import hindiText from "./hindi.json";
import { type SupportedLang, useLanguage } from "@/lib/language";
import "./Faq.css";

const textMap: Record<SupportedLang, typeof englishText> = {
  en: englishText,
  bn: bengaliText,
  hi: hindiText,
};

export default function Faq() {
  const [language] = useLanguage();
  const faqContent = textMap[language];
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
