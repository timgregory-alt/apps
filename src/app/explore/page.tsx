import { redirect } from "next/navigation";

/** Explore is now the app's home screen — this route just catches old links/bookmarks. */
export default function ExplorePage() {
  redirect("/");
}
