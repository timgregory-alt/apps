"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { calculateAge } from "@/lib/utils";
import { LOW_RATING_THRESHOLD } from "@/lib/appRating";

const MIN_AGE = 21;

export async function updateProfileAction(input: { name: string; birth_date: string }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sign in to update your profile");

  const name = input.name.trim();
  if (!name) throw new Error("Name is required");

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
      ...(birthDateChanged ? { birth_date_locked: true } : {}),
    })
    .eq("id", user.id);
  if (error) throw new Error(error.message);

  revalidatePath("/profile");
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
