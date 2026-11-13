import NotFoundView from "./NotFoundView";

/** The 404 inside the site layout (header and footer stay): used by every route that can call notFound(). */
export default function SiteNotFound() {
  return <NotFoundView />;
}
