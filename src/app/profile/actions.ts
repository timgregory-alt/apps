"use server";

import { revalidatePath } from "next/cache";
import { createClient, createAdminClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { calculateAge } from "@/lib/utils";
import { LOW_RATING_THRESHOLD } from "@/lib/appRating";

const MIN_AGE = 21;

export type UpdateProfileResult = { error: string } | { error?: undefined; emailChangePending: boolean };

// This Next.js version's Server Functions redact thrown errors into a
// generic "Server Components render" error on the client — expected errors
// need to come back as return values instead (see
// node_modules/next/dist/docs/01-app/01-getting-started/10-error-handling.md).
export async function updateProfileAction(input: {
  name: string;
  birth_date: string;
  email: string;
  zip_code: string;
}): Promise<UpdateProfileResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to update your profile" };

  const name = input.name.trim();
  if (!name) return { error: "Name is required" };

  const email = input.email.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Please enter a valid email address." };
  }

  const zipCode = input.zip_code.trim();
  if (!/^\d{5}(-\d{4})?$/.test(zipCode)) {
    return { error: "Please enter a valid zip code." };
  }

  const newBirthDate = input.birth_date || null;
  if (newBirthDate && calculateAge(newBirthDate) < MIN_AGE) {
    return { error: `You must be ${MIN_AGE} or older.` };
  }

  const { data: current } = await supabase
    .from("profiles")
    .select("birth_date, birth_date_locked")
    .eq("id", user.id)
    .single();

  const birthDateChanged = (current?.birth_date ?? null) !== newBirthDate;
  if (birthDateChanged && current?.birth_date_locked) {
    return {
      error:
        "Your birthday can only be changed once and has already been set. Contact us if this needs to be corrected.",
    };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      name,
      birth_date: newBirthDate,
      zip_code: zipCode,
      ...(birthDateChanged ? { birth_date_locked: true } : {}),
    })
    .eq("id", user.id);
  if (error) return { error: error.message };

  // Email changes go through Supabase Auth's own confirmation flow rather
  // than the profiles table directly — profiles.email is synced once the
  // guest confirms via the on_auth_user_email_updated trigger.
  let emailChangePending = false;
  if (email !== user.email) {
    const { error: emailError } = await supabase.auth.updateUser({ email });
    if (emailError) return { error: emailError.message };
    emailChangePending = true;
  }

  revalidatePath("/profile");
  return { emailChangePending };
}

/** Submits a new 1-5 star rating of the app itself. A guest can submit more
 * than once over time (e.g. coming back later with new feedback) — each
 * submission is its own row rather than overwriting a prior one. */
export async function submitAppRatingAction(
  rating: number,
  feedback: string
): Promise<{ error: string } | void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to rate the app" };

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { error: "Rating must be 1-5 stars" };
  }

  const trimmedFeedback = feedback.trim();
  if (rating < LOW_RATING_THRESHOLD && !trimmedFeedback) {
    return { error: "Please let us know what went wrong so we can improve." };
  }

  const { error } = await supabase.from("app_ratings").insert({
    user_id: user.id,
    rating,
    feedback: trimmedFeedback || null,
  });
  if (error) return { error: error.message };

  revalidatePath("/profile");
}

/** Self-serve toggle for the subscriber preview — no billing exists yet, so
 * this just flips the same is_subscriber flag an admin can also set from
 * the Members page. RLS already allows a user to update their own profile
 * row, so no separate policy is needed for this one. */
export async function toggleSubscriptionAction(isSubscriber: boolean): Promise<{ error: string } | void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to manage your subscription" };

  const { error } = await supabase
    .from("profiles")
    .update({ is_subscriber: isSubscriber })
    .eq("id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/profile");
  revalidatePath("/rewards");
  revalidatePath("/");
}

/** Submits a "something's broken" report from the Profile page. */
export async function submitBugReportAction(
  description: string,
  pageUrl: string
): Promise<{ error: string } | void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to report a bug" };

  const trimmed = description.trim();
  if (!trimmed) return { error: "Please describe what happened" };

  const { error } = await supabase.from("bug_reports").insert({
    user_id: user.id,
    description: trimmed,
    page_url: pageUrl || null,
  });
  if (error) return { error: error.message };
}

/** Permanently deletes the guest's account. Deleting the auth user cascades
 * through every table that references it (check-ins, ratings, redemptions,
 * etc. all have ON DELETE CASCADE), so no manual cleanup is needed here. */
export async function deleteAccountAction(): Promise<{ error: string } | void> {
  if (!isSupabaseConfigured) return { error: "Account deletion isn't available yet" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to delete your account" };

  const adminClient = await createAdminClient();
  const { error } = await adminClient.auth.admin.deleteUser(user.id);
  if (error) return { error: error.message };

  await supabase.auth.signOut();
}
