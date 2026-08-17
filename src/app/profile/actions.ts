"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { calculateAge } from "@/lib/utils";

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
