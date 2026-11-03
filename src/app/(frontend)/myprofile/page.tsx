import { redirect } from "next/navigation";

/** the profile page lives at /profile; this keeps old links and bookmarks working */
export default function Page() {
  redirect("/profile");
}
