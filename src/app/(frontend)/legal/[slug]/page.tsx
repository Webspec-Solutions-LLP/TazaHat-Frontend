import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLegalDoc } from "@/lib/server/api";
import "./Legal.css";

const plain = (html: string) => html.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const doc = await getLegalDoc(slug).catch(() => null);
  if (!doc) return { title: "Page not found", robots: { index: false } };
  const description = plain(doc.html).slice(0, 180);
  return { title: doc.title, description, alternates: { canonical: `/legal/${doc.slug}` }, openGraph: { title: doc.title, description, type: "article" } };
}

/** A legal document or page written in the CRM (Privacy Policy, Terms & Conditions, Refund policy ...). */
export default async function LegalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const doc = await getLegalDoc(slug).catch(() => null);
  if (!doc) notFound();
  return (
    <main className="legal-page">
      <nav className="legal-crumbs" aria-label="Breadcrumb"><Link href="/">Home</Link><span aria-hidden="true">›</span><span>{doc.title}</span></nav>
      <article className="legal-card">
        <h1>{doc.title}</h1>
        <p className="legal-updated">Last updated {new Date(doc.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
        <div className="legal-body" dangerouslySetInnerHTML={{ __html: doc.html }} />
      </article>
    </main>
  );
}
