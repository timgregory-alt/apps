import { redirect } from "next/navigation";

/** The trail map now lives directly on Explore (the app's home screen) —
 * this route just catches old links/bookmarks and in-app "back to map" taps. */
export default function MapPage() {
  redirect("/");
}
