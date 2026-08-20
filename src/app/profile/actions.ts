"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { calculateAge } from "@/lib/utils";
import { LOW_RATING_THRESHOLD } from "@/lib/appRating";

const MIN_AGE = 21;

export async function updateProfileAction(input: {
  name: string;
  birth_date: string;
  email: string;
  zip_code: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sign in to update your profile");

  const name = input.name.trim();
  if (!name) throw new Error("Name is required");

  const email = input.email.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Please enter a valid email address.");
  }

  const zipCode = input.zip_code.trim();
  if (!/^\d{5}(-\d{4})?$/.test(zipCode)) {
    throw new Error("Please enter a valid zip code.");
  }

  const newBirthDate = input.birth_date || null;
  if (newBirthDate && calculateAge(newBirthDate) < MIN_AGE) {
    throw new Error(`You must be ${MIN_AGE} or older.`);
  }

  const { data: current } = await supabase
    .from("profiles")
    .select("birth_date, birth_date_locked")
    .eq("id", user.id)
    .single();

  const birthDateChanged = (current?.birth_date ?? null) !== newBirthDate;
  if (birthDateChanged && current?.birth_date_locked) {
    throw new Error(
      "Your birthday can only be changed once and has already been set. Contact us if this needs to be corrected."
    );
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
  if (error) throw new Error(error.message);

  // Email changes go through Supabase Auth's own confirmation flow rather
  // than the profiles table directly — profiles.email is synced once the
  // guest confirms via the on_auth_user_email_updated trigger.
  let emailChangePending = false;
  if (email !== user.email) {
    const { error: emailError } = await supabase.auth.updateUser({ email });
    if (emailError) throw new Error(emailError.message);
    emailChangePending = true;
  }

  revalidatePath("/profile");
  return { emailChangePending };
}

/** Submits or updates the guest's 1-5 star rating of the app itself. */
export async function submitAppRatingAction(rating: number, feedback: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sign in to rate the app");

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new Error("Rating must be 1-5 stars");
  }

  const trimmedFeedback = feedback.trim();
  if (rating < LOW_RATING_THRESHOLD && !trimmedFeedback) {
    throw new Error("Please let us know what went wrong so we can improve.");
  }

  const { error } = await supabase.from("app_ratings").upsert(
    {
      user_id: user.id,
      rating,
      feedback: trimmedFeedback || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );
  if (error) throw new Error(error.message);

  revalidatePath("/profile");
}

/** Self-serve toggle for the subscriber preview — no billing exists yet, so
 * this just flips the same is_subscriber flag an admin can also set from
 * the Members page. RLS already allows a user to update their own profile
 * row, so no separate policy is needed for this one. */
export async function toggleSubscriptionAction(isSubscriber: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sign in to manage your subscription");

  const { error } = await supabase
    .from("profiles")
    .update({ is_subscriber: isSubscriber })
    .eq("id", user.id);
  if (error) throw new Error(error.message);

  revalidatePath("/profile");
  revalidatePath("/rewards");
  revalidatePath("/");
}

/** Submits a "something's broken" report from the Profile page. */
export async function submitBugReportAction(description: string, pageUrl: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sign in to report a bug");

  const trimmed = description.trim();
  if (!trimmed) throw new Error("Please describe what happened");

  const { error } = await supabase.from("bug_reports").insert({
    user_id: user.id,
    description: trimmed,
    page_url: pageUrl || null,
  });
  if (error) throw new Error(error.message);
}
