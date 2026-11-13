import { notFound } from "next/navigation";

/** Catches every address that matches no other page (more than one segment, a mistyped link ...) so it gets the site's own 404 inside the layout. */
export default function CatchAll() {
  notFound();
}
